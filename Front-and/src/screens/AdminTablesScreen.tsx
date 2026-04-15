import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';

interface Table {
  name: string;
  columns: string[];
}

interface TableData {
  table: string;
  columns: string[];
  rows: any[];
  count: number;
}

const AdminTablesScreen = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);

  const API_URL = 'http://localhost:8000'; // Či Docker: http://rekon_backend:8000

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/tables`);
      const data = await response.json();
      setTables(data);
    } catch (error) {
      Alert.alert('Chyba', `Nemôžem načítať tabuľky: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (tableName: string) => {
    try {
      setLoading(true);
      setSelectedTable(tableName);
      const response = await fetch(`${API_URL}/api/admin/tables/${tableName}`);
      const data = await response.json();
      setTableData(data);
    } catch (error) {
      Alert.alert('Chyba', `Nemôžem načítať dáta: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📊 Admin - Tabuľky v Databáze</Text>

      {/* Zoznam tabuliek */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tabuľky ({tables.length})</Text>
        {tables.map((table) => (
          <TouchableOpacity
            key={table.name}
            style={[
              styles.tableButton,
              selectedTable === table.name && styles.tableButtonActive,
            ]}
            onPress={() => fetchTableData(table.name)}
          >
            <Text style={styles.tableButtonText}>
              📋 {table.name} ({table.columns.length} stĺpcov)
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Dáta z tabuľky */}
      {tableData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Dáta z tabuľky: {tableData.table} ({tableData.count} riadkov)
          </Text>

          {/* Stĺpce */}
          <View style={styles.columnsView}>
            {tableData.columns.map((col) => (
              <Text key={col} style={styles.columnName}>
                {col}
              </Text>
            ))}
          </View>

          {/* Riadky */}
          {tableData.rows.length > 0 ? (
            tableData.rows.map((row, index) => (
              <View key={index} style={styles.row}>
                {tableData.columns.map((col) => (
                  <Text key={col} style={styles.cell}>
                    {String(row[col] || '-')}
                  </Text>
                ))}
              </View>
            ))
          ) : (
            <Text style={styles.empty}>Tabuľka je prázdna</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  tableButton: {
    backgroundColor: '#e8f4f8',
    padding: 12,
    marginVertical: 5,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  tableButtonActive: {
    backgroundColor: '#007AFF',
  },
  tableButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  columnsView: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 4,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  columnName: {
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
    marginBottom: 5,
    padding: 5,
    backgroundColor: '#ddd',
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 8,
    flexWrap: 'wrap',
  },
  cell: {
    flex: 1,
    color: '#555',
    marginRight: 10,
    marginBottom: 5,
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 10,
  },
});

export default AdminTablesScreen;
