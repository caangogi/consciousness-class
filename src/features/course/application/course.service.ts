
// src/features/course/application/course.service.ts
import { CourseEntity, type CourseStatus } from '@/features/course/domain/entities/course.entity';
import type { ICourseRepository } from '@/features/course/domain/repositories/course.repository';
import type { CreateCourseDto } from '@/features/course/infrastructure/dto/create-course.dto';
import type { UpdateCourseDto } from '@/features/course/infrastructure/dto/update-course.dto';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export class CourseService {
  constructor(private readonly courseRepository: ICourseRepository) {}

  private async manageStripeProductAndPrice(course: CourseEntity): Promise<{ stripeProductId: string | null; stripePriceId: string | null }> {
    let currentStripeProductId = course.stripeProductId;
    let currentStripePriceId = course.stripePriceId;

    if (course.tipoAcceso === 'suscripcion' && course.precio > 0) {
      // 1. Asegurar Producto en Stripe
      if (!currentStripeProductId) {
        try {
          const product = await stripe.products.create({
            name: `MentorBloom Course: ${course.nombre}`,
            metadata: { platform_course_id: course.id },
          });
          currentStripeProductId = product.id;
          console.log(`[CourseService] Stripe Product created for course ${course.id}: ${currentStripeProductId}`);
        } catch (e: any) {
          console.error(`[CourseService] Error creating Stripe Product for course ${course.id}:`, e.message);
          throw new Error(`Stripe Product creation failed: ${e.message}`);
        }
      }

      // 2. Asegurar Precio en Stripe (crear si no existe o si el precio/intervalo cambió)
      // Para esta iteración, asumimos que el cambio de precio implica crear uno nuevo.
      // Una lógica más avanzada manejaría el archivo de precios antiguos.
      let priceNeedsUpdate = !currentStripePriceId;
      if (currentStripePriceId) {
        try {
          const existingPrice = await stripe.prices.retrieve(currentStripePriceId);
          if (existingPrice.unit_amount !== Math.round(course.precio * 100) || !existingPrice.active) {
            priceNeedsUpdate = true;
            // Opcional: Archivar el precio antiguo si ya no se usará para nuevas suscripciones
            // await stripe.prices.update(currentStripePriceId, { active: false });
            // console.log(`[CourseService] Stripe Price ${currentStripePriceId} archived for course ${course.id}.`);
          }
        } catch (e: any) {
          console.warn(`[CourseService] Could not retrieve Stripe Price ${currentStripePriceId} for course ${course.id}, will create new. Error: ${e.message}`);
          priceNeedsUpdate = true; // Price might have been deleted or is invalid
        }
      }

      if (priceNeedsUpdate && currentStripeProductId) {
        try {
          const price = await stripe.prices.create({
            product: currentStripeProductId,
            unit_amount: Math.round(course.precio * 100), // Stripe espera el precio en céntimos
            currency: 'eur', // Asumiendo EUR, esto debería ser configurable si es necesario
            recurring: { interval: 'month' }, // Asumiendo mensual, esto debería ser configurable
            metadata: { platform_course_id: course.id },
          });
          currentStripePriceId = price.id;
          console.log(`[CourseService] Stripe Price created/updated for course ${course.id}: ${currentStripePriceId}`);
        } catch (e: any) {
          console.error(`[CourseService] Error creating Stripe Price for course ${course.id}:`, e.message);
          throw new Error(`Stripe Price creation failed: ${e.message}`);
        }
      }
    } else {
      // Si el curso no es una suscripción de pago, no debería tener un precio de Stripe activo
      if (currentStripePriceId) {
        try {
          // await stripe.prices.update(currentStripePriceId, { active: false });
          // console.log(`[CourseService] Stripe Price ${currentStripePriceId} archived as course ${course.id} is no longer a paid subscription.`);
        } catch (e: any) {
          console.warn(`[CourseService] Could not archive Stripe Price ${currentStripePriceId} for course ${course.id}:`, e.message);
        }
        currentStripePriceId = null; // Limpiar el ID si ya no aplica
      }
      // El producto podría mantenerse o limpiarse también. Por ahora, solo el precio.
      // currentStripeProductId = null;
    }
    return { stripeProductId: currentStripeProductId, stripePriceId: currentStripePriceId };
  }

  async createCourse(dto: CreateCourseDto, creatorUid: string): Promise<CourseEntity> {
    try {
      const courseEntity = CourseEntity.create({
        ...dto,
        creadorUid: creatorUid,
        comisionReferidoPorcentaje: dto.comisionReferidoPorcentaje === undefined ? null : dto.comisionReferidoPorcentaje,
      });

      if (courseEntity.tipoAcceso === 'suscripcion' && courseEntity.precio > 0) {
        const stripeIds = await this.manageStripeProductAndPrice(courseEntity);
        courseEntity.stripeProductId = stripeIds.stripeProductId;
        courseEntity.stripePriceId = stripeIds.stripePriceId;
      }

      await this.courseRepository.save(courseEntity);
      console.log('[CourseService] Course created successfully for UID: ' + creatorUid + ', Course ID: ' + courseEntity.id);
      return courseEntity;
    } catch (error: any) {
      console.error('[CourseService] Error creating course for UID ' + creatorUid + ':', error.message);
      throw new Error('Failed to create course: ' + error.message);
    }
  }

  async getCourseById(id: string): Promise<CourseEntity | null> {
    try {
      return await this.courseRepository.findById(id);
    } catch (error: any) {
      console.error('[CourseService] Error fetching course by ID ' + id + ':', error.message);
      throw new Error('Failed to fetch course: ' + error.message);
    }
  }

  async getCoursesByCreator(creatorUid: string): Promise<CourseEntity[]> {
    try {
      return await this.courseRepository.findAllByCreator(creatorUid);
    } catch (error: any) {
      console.error('[CourseService] Error fetching courses for creator UID ' + creatorUid + ':', error.message);
      throw new Error('Failed to fetch courses by creator: ' + error.message);
    }
  }

  async getAllPublicCourses(): Promise<CourseEntity[]> {
    try {
      return await this.courseRepository.findAllPublic();
    } catch (error: any) {
      console.error('[CourseService] Error fetching all public courses:', error.message);
      throw new Error('Failed to fetch public courses: ' + error.message);
    }
  }

  async updateCourse(courseId: string, dto: UpdateCourseDto, updaterUid: string): Promise<CourseEntity | null> {
    try {
      const courseEntity = await this.courseRepository.findById(courseId);
      if (!courseEntity) {
        console.warn(`[CourseService] Course not found for update with ID: ${courseId}`);
        return null;
      }

      if (courseEntity.creadorUid !== updaterUid) {
        console.error(`[CourseService] Forbidden: User ${updaterUid} is not the creator of course ${courseId}.`);
        throw new Error('Forbidden: User is not the creator of the course.');
      }

      // Guardar el precio original y tipo de acceso para comparar después de la actualización
      const originalPrice = courseEntity.precio;
      const originalTipoAcceso = courseEntity.tipoAcceso;

      const updateData: Partial<Parameters<typeof courseEntity.update>[0]> = {};
      if (dto.nombre !== undefined) updateData.nombre = dto.nombre;
      if (dto.descripcionCorta !== undefined) updateData.descripcionCorta = dto.descripcionCorta;
      if (dto.descripcionLarga !== undefined) updateData.descripcionLarga = dto.descripcionLarga;
      if (dto.precio !== undefined) updateData.precio = dto.precio;
      if (dto.tipoAcceso !== undefined) updateData.tipoAcceso = dto.tipoAcceso;
      if (dto.categoria !== undefined) updateData.categoria = dto.categoria;
      if (dto.duracionEstimada !== undefined) updateData.duracionEstimada = dto.duracionEstimada;
      if (dto.imagenPortadaUrl !== undefined) updateData.imagenPortadaUrl = dto.imagenPortadaUrl;
      if (dto.dataAiHintImagenPortada !== undefined) updateData.dataAiHintImagenPortada = dto.dataAiHintImagenPortada;
      if (dto.videoTrailerUrl !== undefined) updateData.videoTrailerUrl = dto.videoTrailerUrl;
      if (dto.estado !== undefined) updateData.estado = dto.estado as CourseStatus;
      if (dto.comisionReferidoPorcentaje !== undefined) updateData.comisionReferidoPorcentaje = dto.comisionReferidoPorcentaje;

      if (Object.keys(updateData).length > 0) {
        courseEntity.update(updateData); // Actualiza la entidad localmente
      }

      // Gestionar Producto/Precio en Stripe si es una suscripción o si cambió el precio/tipo
      const priceOrTypeChanged = (dto.precio !== undefined && dto.precio !== originalPrice) ||
                                 (dto.tipoAcceso !== undefined && dto.tipoAcceso !== originalTipoAcceso);

      if (courseEntity.tipoAcceso === 'suscripcion' || (originalTipoAcceso === 'suscripcion' && priceOrTypeChanged)) {
        const stripeIds = await this.manageStripeProductAndPrice(courseEntity);
        courseEntity.stripeProductId = stripeIds.stripeProductId;
        courseEntity.stripePriceId = stripeIds.stripePriceId;
      } else if (dto.tipoAcceso === 'unico' && originalTipoAcceso === 'suscripcion') {
        // Si cambió de suscripción a pago único, limpiar IDs de Stripe y archivar precio
        if (courseEntity.stripePriceId) {
          try {
            // await stripe.prices.update(courseEntity.stripePriceId, { active: false });
            // console.log(`[CourseService] Stripe Price ${courseEntity.stripePriceId} archived due to type change for course ${courseId}.`);
          } catch (e: any) {
            console.warn(`[CourseService] Could not archive Stripe Price ${courseEntity.stripePriceId} for course ${courseId}: ${e.message}`);
          }
        }
        courseEntity.stripePriceId = null;
        // Considerar si se debe archivar el producto si no tiene otros precios activos
        // courseEntity.stripeProductId = null;
      }


      await this.courseRepository.save(courseEntity); // Guardar la entidad actualizada (con IDs de Stripe si aplica)
      console.log(`[CourseService] Course ${courseId} updated successfully by UID: ${updaterUid} with data:`, updateData);

      return courseEntity;

    } catch (error: any) {
      console.error(`[CourseService] Error updating course ID ${courseId} by UID ${updaterUid}:`, error.message);
      if (error.message.startsWith('Forbidden:')) {
          throw error;
      }
      throw new Error(`Failed to update course: ${error.message}`);
    }
  }

  async reorderModules(courseId: string, orderedModuleIds: string[], updaterUid: string): Promise<CourseEntity | null> {
    try {
      const courseEntity = await this.courseRepository.findById(courseId);
      if (!courseEntity) {
        throw new Error(`Course with ID ${courseId} not found.`);
      }
      if (courseEntity.creadorUid !== updaterUid) {
        throw new Error(`Forbidden: User ${updaterUid} is not the creator of course ${courseId}.`);
      }

      const currentModuleIds = courseEntity.ordenModulos || [];
      const allExistAndMatch = orderedModuleIds.every(id => currentModuleIds.includes(id)) && orderedModuleIds.length === currentModuleIds.length;
      if (!allExistAndMatch && currentModuleIds.length > 0) {
        console.warn(`[CourseService] Reorder validation failed. Ordered IDs: ${orderedModuleIds}. Current IDs: ${currentModuleIds}`);
      }

      courseEntity.update({ ordenModulos: orderedModuleIds });
      await this.courseRepository.save(courseEntity);
      console.log(`[CourseService] Modules reordered for course ${courseId} by UID: ${updaterUid}. New order: ${orderedModuleIds.join(', ')}`);
      return courseEntity;
    } catch (error: any) {
      console.error(`[CourseService] Error reordering modules for course ID ${courseId} by UID ${updaterUid}:`, error.message);
      throw error;
    }
  }
}

    