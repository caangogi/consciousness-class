import * as React from 'react';
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text, Button } from '@react-email/components';
import { styles } from './theme';
import type { EnrollmentCreatedProps } from './types';

export function EnrollmentCreated(props: EnrollmentCreatedProps): React.ReactElement {
  const brand = props.brandName ?? 'Consciousness Class';
  return (
    <Html lang="es">
      <Head />
      <Preview>{`Bienvenido a ${props.assetName}`}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.card}>
            <Text style={styles.brandLabel}>{brand}</Text>
            <Heading as="h1" style={styles.h1}>
              Bienvenido, {props.studentName}.
            </Heading>
            <Text style={styles.paragraph}>
              Ya tienes acceso a <strong>{props.assetName}</strong>, el {props.assetType} creado por {props.creatorName}.
            </Text>
            <Text style={styles.paragraph}>
              Tómate tu tiempo. Este espacio es tuyo y puedes volver a él cuando lo necesites.
            </Text>

            <Hr style={styles.hr} />

            <Section style={{ textAlign: 'center', margin: '8px 0 0' }}>
              <Button href={props.startUrl} style={styles.button}>
                Empezar ahora
              </Button>
            </Section>

            <Text style={{ ...styles.meta, textAlign: 'center', marginTop: '16px' }}>
              Si tienes preguntas, responde a este email — {props.creatorName} las recibe.
            </Text>
          </Section>

          <Text style={styles.footer}>
            {brand} · una pausa consciente entre tu día y tu práctica.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
