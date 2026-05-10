import * as React from 'react';
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text, Button } from '@react-email/components';
import { styles } from './theme';
import type { BookingConfirmedPatientProps } from './types';

export function BookingConfirmedPatient(props: BookingConfirmedPatientProps): React.ReactElement {
  const brand = props.brandName ?? 'Consciousness Class';
  return (
    <Html lang="es">
      <Head />
      <Preview>{`Tu sesión con ${props.creatorName} está confirmada · ${props.bookingDate}`}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.card}>
            <Text style={styles.brandLabel}>{brand}</Text>
            <Heading as="h1" style={styles.h1}>
              Tu sesión está confirmada, {props.patientName}.
            </Heading>
            <Text style={styles.paragraph}>
              Hemos recibido tu pago y reservado tu espacio con {props.creatorName}.
              A continuación los detalles para que los tengas a mano.
            </Text>

            <Hr style={styles.hr} />

            <Text style={styles.detailRow}>
              <span style={styles.detailLabel}>Fecha:</span>{props.bookingDate}
            </Text>
            <Text style={styles.detailRow}>
              <span style={styles.detailLabel}>Hora:</span>{props.bookingTime}
            </Text>
            <Text style={styles.detailRow}>
              <span style={styles.detailLabel}>Duración:</span>{props.bookingDurationMin} minutos
            </Text>
            <Text style={styles.detailRow}>
              <span style={styles.detailLabel}>Con:</span>{props.creatorName}
            </Text>

            {props.meetingLink && (
              <>
                <Hr style={styles.hr} />
                <Section style={{ textAlign: 'center', margin: '8px 0 0' }}>
                  <Button href={props.meetingLink} style={styles.button}>
                    Unirme a la sesión
                  </Button>
                </Section>
                <Text style={{ ...styles.meta, textAlign: 'center', marginTop: '12px' }}>
                  Guarda este enlace. Te recomendamos abrirlo 2 minutos antes.
                </Text>
              </>
            )}

            {props.cancelUrl && (
              <>
                <Hr style={styles.hr} />
                <Text style={styles.meta}>
                  ¿Necesitas cancelar? Puedes hacerlo desde{' '}
                  <a href={props.cancelUrl} style={{ color: '#6B7A4F' }}>
                    tu panel
                  </a>
                  . Las cancelaciones con más de 24 h de antelación reciben reembolso completo.
                </Text>
              </>
            )}
          </Section>

          <Text style={styles.footer}>
            {brand} · sesiones, cursos y comunidad para creadores holísticos.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
