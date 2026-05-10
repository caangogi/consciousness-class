import * as React from 'react';
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text, Button } from '@react-email/components';
import { styles } from './theme';
import type { BookingConfirmedCreatorProps } from './types';

export function BookingConfirmedCreator(props: BookingConfirmedCreatorProps): React.ReactElement {
  const brand = props.brandName ?? 'Consciousness Class';
  return (
    <Html lang="es">
      <Head />
      <Preview>{`Nueva reserva: ${props.patientName} para el ${props.bookingDate}`}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.card}>
            <Text style={styles.brandLabel}>{brand}</Text>
            <Heading as="h1" style={styles.h1}>
              Nueva reserva confirmada.
            </Heading>
            <Text style={styles.paragraph}>
              Hola {props.creatorName}, {props.patientName} ha reservado y pagado una sesión contigo.
            </Text>

            <Hr style={styles.hr} />

            <Text style={styles.detailRow}>
              <span style={styles.detailLabel}>Paciente:</span>{props.patientName}
            </Text>
            <Text style={styles.detailRow}>
              <span style={styles.detailLabel}>Email:</span>{props.patientEmail}
            </Text>
            <Text style={styles.detailRow}>
              <span style={styles.detailLabel}>Fecha:</span>{props.bookingDate}
            </Text>
            <Text style={styles.detailRow}>
              <span style={styles.detailLabel}>Hora:</span>{props.bookingTime}
            </Text>
            <Text style={styles.detailRow}>
              <span style={styles.detailLabel}>Duración:</span>{props.bookingDurationMin} minutos
            </Text>

            <Hr style={styles.hr} />

            <Section style={{ textAlign: 'center', margin: '8px 0 0' }}>
              <Button href={props.dashboardUrl} style={styles.button}>
                Ver en mi panel
              </Button>
            </Section>

            <Text style={{ ...styles.meta, textAlign: 'center', marginTop: '12px' }}>
              El paciente recibe la confirmación por separado con el enlace de la sesión si lo configuraste.
            </Text>
          </Section>

          <Text style={styles.footer}>
            {brand} · gestión de sesiones, cursos y comunidad para tu práctica.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
