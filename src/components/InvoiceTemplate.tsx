import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, textAlign: 'center' },
  title: { fontSize: 24, marginBottom: 10 },
  section: { margin: 10, padding: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  total: { borderTop: '1px solid black', paddingTop: 5, marginTop: 10, fontWeight: 'bold' },
});

interface InvoiceProps {
  appointmentId: string;
  date: string;
  customerName: string;
  serviceName: string;
  price: number;
  barberName: string;
}

export const InvoiceDocument = ({ appointmentId, date, customerName, serviceName, price, barberName }: InvoiceProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>ALKOS BARBER - RECHNUNG</Text>
        <Text>Wiedner Guertel 12, 1040 Wien</Text>
      </View>

      <View style={styles.section}>
        <Text>Rechnungs-Nr: {appointmentId.slice(-6).toUpperCase()}</Text>
        <Text>Datum: {date}</Text>
        <Text>Kunde: {customerName}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
            <Text>{serviceName} (bei {barberName})</Text>
            <Text>{price.toFixed(2)} EUR</Text>
        </View>
      </View>

      <View style={styles.section}>
         <View style={[styles.row, styles.total]}>
            <Text>Gesamtbetrag:</Text>
            <Text>{price.toFixed(2)} EUR</Text>
         </View>
      </View>
    </Page>
  </Document>
);