import * as React from 'react';
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components';
import { styles, colors } from './theme';
import type { BookingCancelledProps } from './types';

function refundLine(props: BookingCancelledProps): string {
  if (props.refundEligible === true && props.refundAmount) {
    return `Tu reembolso de ${props.refundAmount} se procesará en los próximos 5–10 días hábiles.`;
  }
  if (props.refundEligible === true) {
    return `Tu reembolso completo se procesará en los próximos 5–10 días hábiles.`;
  }
  if (props.refundEligible === false) {
    return `Esta sesión no es elegible para reembolso (cancelaciones con menos de 24 h de antelación).`;
  }
  return `No hay cargo asociado a esta cancelación.`;
}

function whoLine(by: BookingCancelledProps['cancelledBy']): string {
  switch (by) {
    case 'patient': return 'Has cancelado tu sesión.';
    case 'creator': return 'El creador ha cancelado la sesión.';
    case 'system':  return 'La sesión se ha cancelado automáticamente.';
  }
}

export function BookingCancelled(props: BookingCancelledProps): React.ReactElement {
  const brand = props.brandName ?? 'Consciousness Class';
  return (
    <Html lang="es">
      <Head />
      <Preview>{`Sesión cancelada · ${props.bookingDate}`}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.card}>
            <Text style={styles.brandLabel}>{brand}</Text>
            <Heading as="h1" style={styles.h1}>
              Sesión cancelada
            </Heading>
            <Text style={styles.paragraph}>
              Hola {props.recipientName}, {whoLine(props.cancelledBy)}
            </Text>

            <Hr style={styles.hr} />

            <Text style={styles.detailRow}>
              <span style={styles.detailLabel}>Fecha original:</span>{props.bookingDate}
            </Text>
            <Text style={styles.detailRow}>
              <span style={styles.detailLabel}>Hora:</span>{props.bookingTime}
            </Text>

            <Hr style={styles.hr} />

            <Text style={{ ...styles.paragraph, color: colors.oliveDark }}>
              {refundLine(props)}
            </Text>
          </Section>

          <Text style={styles.footer}>
            {brand} · cuando vuelvas, aquí estaremos.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
