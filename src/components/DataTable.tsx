import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { Text, Checkbox, IconButton, Menu, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS } from '../config/constants';

interface Column<T> {
  key: keyof T | string;
  title: string;
  width?: number | string;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  onRowPress?: (item: T) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  emptyMessage?: string;
  actions?: (item: T) => React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  onRowPress,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  sortColumn,
  sortDirection,
  onSort,
  emptyMessage = 'No data available',
  actions,
}: DataTableProps<T>) {
  const { isWeb, isDesktop } = useResponsive();

  const handleSelectAll = () => {
    if (selectedIds.length === data.length) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(data.map(keyExtractor));
    }
  };

  const handleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange?.(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange?.([...selectedIds, id]);
    }
  };

  const renderHeader = () => (
    <View style={[styles.row, styles.headerRow]}>
      {selectable && (
        <View style={styles.checkboxCell}>
          <Checkbox
            status={
              selectedIds.length === data.length && data.length > 0
                ? 'checked'
                : selectedIds.length > 0
                ? 'indeterminate'
                : 'unchecked'
            }
            onPress={handleSelectAll}
          />
        </View>
      )}
      {columns.map((column) => (
        <Pressable
          key={String(column.key)}
          style={[
            styles.cell,
            styles.headerCell,
            column.width ? { width: column.width, flex: undefined } : { flex: 1 },
            { alignItems: column.align === 'right' ? 'flex-end' : column.align === 'center' ? 'center' : 'flex-start' },
          ]}
          onPress={() => column.sortable && onSort?.(String(column.key))}
          disabled={!column.sortable}
        >
          <Text style={styles.headerText}>{column.title}</Text>
          {column.sortable && sortColumn === column.key && (
            <MaterialCommunityIcons
              name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={COLORS.gray600}
            />
          )}
        </Pressable>
      ))}
      {actions && <View style={styles.actionsCell} />}
    </View>
  );

  const renderRow = (item: T, index: number) => {
    const id = keyExtractor(item);
    const isSelected = selectedIds.includes(id);

    return (
      <Pressable
        key={id}
        style={[
          styles.row,
          styles.dataRow,
          index % 2 === 0 && styles.evenRow,
          isSelected && styles.selectedRow,
        ]}
        onPress={() => onRowPress?.(item)}
      >
        {selectable && (
          <View style={styles.checkboxCell}>
            <Checkbox
              status={isSelected ? 'checked' : 'unchecked'}
              onPress={() => handleSelectRow(id)}
            />
          </View>
        )}
        {columns.map((column) => (
          <View
            key={String(column.key)}
            style={[
              styles.cell,
              column.width ? { width: column.width, flex: undefined } : { flex: 1 },
              { alignItems: column.align === 'right' ? 'flex-end' : column.align === 'center' ? 'center' : 'flex-start' },
            ]}
          >
            {column.render ? (
              column.render(item, index)
            ) : (
              <Text style={styles.cellText} numberOfLines={1}>
                {item[column.key as keyof T]?.toString() || '—'}
              </Text>
            )}
          </View>
        ))}
        {actions && <View style={styles.actionsCell}>{actions(item)}</View>}
      </Pressable>
    );
  };

  if (!isWeb || !isDesktop) {
    // On mobile, render as cards instead
    return (
      <View style={styles.mobileContainer}>
        {data.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          </View>
        ) : (
          data.map((item, index) => (
            <Pressable
              key={keyExtractor(item)}
              style={styles.mobileCard}
              onPress={() => onRowPress?.(item)}
            >
              {columns.map((column) => (
                <View key={String(column.key)} style={styles.mobileRow}>
                  <Text style={styles.mobileLabel}>{column.title}</Text>
                  {column.render ? (
                    column.render(item, index)
                  ) : (
                    <Text style={styles.mobileValue} numberOfLines={1}>
                      {item[column.key as keyof T]?.toString() || '—'}
                    </Text>
                  )}
                </View>
              ))}
              {actions && <View style={styles.mobileActions}>{actions(item)}</View>}
            </Pressable>
          ))
        )}
      </View>
    );
  }

  return (
    <ScrollView horizontal style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.table}>
        {renderHeader()}
        <Divider />
        {data.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          </View>
        ) : (
          data.map(renderRow)
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    minWidth: '100%',
  },
  table: {
    minWidth: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  headerRow: {
    backgroundColor: COLORS.gray100,
  },
  dataRow: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  evenRow: {
    backgroundColor: COLORS.gray50,
  },
  selectedRow: {
    backgroundColor: `${COLORS.primary}10`,
  },
  cell: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerCell: {
    // Header-specific styles
  },
  headerText: {
    fontWeight: '600',
    color: COLORS.gray700,
    fontSize: 13,
    textTransform: 'uppercase',
  },
  cellText: {
    color: COLORS.gray800,
    fontSize: 14,
  },
  checkboxCell: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsCell: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.gray500,
    fontSize: 14,
  },
  // Mobile styles
  mobileContainer: {
    padding: 16,
    gap: 12,
  },
  mobileCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  mobileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  mobileLabel: {
    fontSize: 12,
    color: COLORS.gray500,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  mobileValue: {
    fontSize: 14,
    color: COLORS.gray800,
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  mobileActions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
