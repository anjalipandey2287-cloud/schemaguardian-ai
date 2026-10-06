import { NormalizedTable, UserRole } from '../types/schema';

const SYNTHETIC_FIRST_NAMES = ['Aria', 'Caleb', 'Devon', 'Elena', 'Julian', 'Kiran', 'Maya', 'Nico', 'Rowan', 'Zara'];
const SYNTHETIC_LAST_NAMES = ['Sterling', 'Vance', 'Mercer', 'Castillo', 'Hawthorne', 'Nakamura', 'O’Connor', 'Skov', 'Bennett', 'Winter'];
const SYNTHETIC_STREETS = ['42 Hyperion Way', '180 Cobalt Circle', '91 Foundry St', '304 Apex Parkway', '77 Meridian Blvd'];
const SYNTHETIC_DOMAINS = ['acmefabric.io', 'synthonline.org', 'mockenterprise.com', 'securedata.internal'];

// Simple deterministic hash
function pseudoHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `0x${hex}${hex}`;
}

export function generateSyntheticTableRecords(
  table: NormalizedTable,
  count: number = 5,
  seedPrefix: string = 'SYN'
): Record<string, any>[] {
  const records: Record<string, any>[] = [];

  for (let i = 0; i < count; i++) {
    const record: Record<string, any> = {};
    const firstName = SYNTHETIC_FIRST_NAMES[(i + 3) % SYNTHETIC_FIRST_NAMES.length];
    const lastName = SYNTHETIC_LAST_NAMES[(i * 2 + 1) % SYNTHETIC_LAST_NAMES.length];
    const domain = SYNTHETIC_DOMAINS[i % SYNTHETIC_DOMAINS.length];

    for (const col of table.columns) {
      const lower = col.name.toLowerCase();

      if (col.isPrimaryKey) {
        if (col.dataType.includes('INT')) {
          record[col.name] = 8000 + i + 1;
        } else {
          record[col.name] = `${seedPrefix}-${table.tableName.substring(0, 3).toUpperCase()}-${100 + i}`;
        }
      } else if (col.isForeignKey) {
        if (col.dataType.includes('INT')) {
          record[col.name] = i + 1;
        } else {
          record[col.name] = `${col.references?.table.substring(0, 3).toUpperCase() || 'REF'}-${101 + (i % 3)}`;
        }
      } else if (lower.includes('name')) {
        record[col.name] = `${firstName} ${lastName}`;
      } else if (lower.includes('email')) {
        record[col.name] = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
      } else if (lower.includes('phone')) {
        record[col.name] = `555-019-${String(2000 + i * 37).slice(-4)}`;
      } else if (lower.includes('ssn') || lower.includes('tax')) {
        record[col.name] = `***-**-${String(5000 + i * 91).slice(-4)}`;
      } else if (lower.includes('card')) {
        record[col.name] = String(4000 + i * 111).slice(-4);
      } else if (lower.includes('address') || lower.includes('street')) {
        record[col.name] = SYNTHETIC_STREETS[i % SYNTHETIC_STREETS.length];
      } else if (lower.includes('date')) {
        record[col.name] = `2024-03-${String(10 + i).padStart(2, '0')}`;
      } else if (col.dataType === 'BOOLEAN') {
        record[col.name] = i % 2 === 0;
      } else if (col.dataType === 'INTEGER') {
        record[col.name] = Math.floor(1 + (i * 3) % 10);
      } else if (col.dataType.includes('DECIMAL')) {
        record[col.name] = Number((24.5 + i * 18.25).toFixed(2));
      } else {
        record[col.name] = `Synthetic_${col.name}_${i + 1}`;
      }
    }
    records.push(record);
  }

  return records;
}

// Dynamic Data Masking simulator for UI demo
export function applyRoleBasedMasking(
  records: Record<string, any>[],
  columns: { name: string; isPII: boolean; piiCategory: string }[],
  role: UserRole
): Record<string, any>[] {
  if (role === 'ADMIN') {
    return records;
  }

  return records.map((row) => {
    const maskedRow: Record<string, any> = {};

    for (const [key, val] of Object.entries(row)) {
      const col = columns.find((c) => c.name === key);

      if (!col || !col.isPII || val === null || val === undefined) {
        maskedRow[key] = val;
        continue;
      }

      const strVal = String(val);

      if (role === 'SUPPORT_AGENT') {
        if (key.includes('email')) {
          const parts = strVal.split('@');
          maskedRow[key] = parts.length === 2 ? `${parts[0].slice(0, 2)}***@***.${parts[1].split('.')[1] || 'com'}` : '***@***.com';
        } else if (key.includes('phone')) {
          maskedRow[key] = `***-***-${strVal.slice(-4)}`;
        } else if (key.includes('ssn') || key.includes('tax') || key.includes('card')) {
          maskedRow[key] = `***-**-${strVal.slice(-4)}`;
        } else if (key.includes('name')) {
          maskedRow[key] = `${strVal.charAt(0)}. [REDACTED_PII]`;
        } else {
          maskedRow[key] = '*** [PROTECTED] ***';
        }
      } else if (role === 'DATA_ANALYST') {
        // Full pseudonymization via hash
        maskedRow[key] = pseudoHash(strVal);
      } else if (role === 'AUDITOR') {
        // Read-only with watermarked token
        maskedRow[key] = `[AUDIT_LOGGED] ${strVal}`;
      } else {
        maskedRow[key] = '[RESTRICTED]';
      }
    }

    return maskedRow;
  });
}
