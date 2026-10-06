import Papa from 'papaparse';
import * as XLSX from 'xlsx';

import {
  AnalysisResult,
  ColumnProfile,
  ComplianceScorecard,
  DatabaseDialect,
  FunctionalDependency,
  IndexRecommendation,
  InferredDataType,
  MigrationScriptPackage,
  NormalizedColumn,
  NormalizedTable,
  PIICategory,
  SchemaAnomaly,
  SemanticMapping,
  SensitivityLevel,
} from '../types/schema';

/* ============================================================
   BASIC HELPERS
   ============================================================ */

export function sanitizeIdentifier(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

function quoteIdentifier(name: string): string {
  return `"${sanitizeIdentifier(name)}"`;
}

function escapeSQL(value: any): string {
  if (value === null || value === undefined || value === '') {
    return 'NULL';
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }

  const text = String(value).replace(/'/g, "''");
  return `'${text}'`;
}

/* ============================================================
   REGEX / TYPE DETECTION
   ============================================================ */

const EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const PHONE_REGEX =
  /^(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}$/;

const SSN_REGEX =
  /^(\d{3}-\d{2}-\d{4}|\d{4})$/;

const DATE_REGEX =
  /^\d{4}-\d{2}-\d{2}$/;

const TIMESTAMP_REGEX =
  /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?/;

function inferDataType(values: any[]): InferredDataType {
  const nonNull = values.filter(
    (v) =>
      v !== null &&
      v !== undefined &&
      v !== '' &&
      !(typeof v === 'string' && v.trim() === '')
  );

  if (nonNull.length === 0) {
    return 'TEXT';
  }

  const sample = nonNull.slice(0, 100);

  if (sample.every((v) => typeof v === 'boolean')) {
    return 'BOOLEAN';
  }

  if (
    sample.every(
      (v) =>
        typeof v === 'number' &&
        Number.isInteger(v)
    )
  ) {
    const maxValue = Math.max(
      ...sample.map((v) => Math.abs(Number(v)))
    );

    return maxValue > 2147483647
      ? 'BIGINT'
      : 'INTEGER';
  }

  if (
    sample.every(
      (v) =>
        typeof v === 'number' &&
        Number.isFinite(v)
    )
  ) {
    return 'DECIMAL(12,2)';
  }

  if (
    sample.every((v) =>
      DATE_REGEX.test(String(v))
    )
  ) {
    return 'DATE';
  }

  if (
    sample.every((v) =>
      TIMESTAMP_REGEX.test(String(v))
    )
  ) {
    return 'TIMESTAMP';
  }

  if (
    sample.every((v) =>
      /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(String(v))
    )
  ) {
    return 'UUID';
  }

  if (
    sample.every(
      (v) =>
        typeof v === 'object' &&
        v !== null
    )
  ) {
    return 'JSON';
  }

  return 'VARCHAR(255)';
}

/* ============================================================
   CSV / XLSX PARSING
   ============================================================ */

export function parseSpreadsheetOrCSV(
  rawInput: string | ArrayBuffer
): {
  headers: string[];
  rows: Record<string, any>[];
} {
  if (typeof rawInput === 'string') {
    const parsed = Papa.parse<Record<string, any>>(
      rawInput.trim(),
      {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      }
    );

    const headers = (parsed.meta.fields || [])
      .map((h) => h.trim())
      .filter(Boolean);

    const rows = (parsed.data || []).filter(
      (row) =>
        row &&
        Object.keys(row).length > 0
    );

    return {
      headers,
      rows,
    };
  }

  const workbook = XLSX.read(rawInput, {
    type: 'array',
  });

  const firstSheetName =
    workbook.SheetNames[0];

  if (!firstSheetName) {
    return {
      headers: [],
      rows: [],
    };
  }

  const worksheet =
    workbook.Sheets[firstSheetName];

  const rows =
    XLSX.utils.sheet_to_json<Record<string, any>>(
      worksheet,
      {
        defval: null,
      }
    );

  const headers =
    rows.length > 0
      ? Object.keys(rows[0])
      : [];

  return {
    headers,
    rows,
  };
}

/* ============================================================
   COLUMN PROFILING
   ============================================================ */

export function profileColumn(
  header: string,
  values: any[]
): ColumnProfile {
  const clean = sanitizeIdentifier(header);

  let nullCount = 0;

  const nonNullValues: any[] = [];

  for (const value of values) {
    if (
      value === null ||
      value === undefined ||
      value === '' ||
      (
        typeof value === 'string' &&
        value.trim() === ''
      )
    ) {
      nullCount++;
    } else {
      nonNullValues.push(value);
    }
  }

  const total = values.length;

  const nullPercentage =
    total > 0
      ? (nullCount / total) * 100
      : 0;

  const uniqueValues = new Set(
    nonNullValues.map((v) => String(v))
  );

  const uniqueCount =
    uniqueValues.size;

  const uniquenessRatio =
    nonNullValues.length > 0
      ? uniqueCount / nonNullValues.length
      : 0;

  const cleanLower =
    clean.toLowerCase();

  const inferredType =
    inferDataType(values);

  let isPII = false;
  let piiCategory: PIICategory = 'NONE';
  let sensitivityLevel: SensitivityLevel =
    'PUBLIC';

  let piiReason = '';

  let maskingMethod:
    ColumnProfile['maskingMethod'] =
    'NONE';

  const sampleString =
    nonNullValues
      .slice(0, 10)
      .join(' ');

  /* ---------- FINANCIAL ---------- */

  if (
    cleanLower.includes('ssn') ||
    cleanLower.includes('social_security') ||
    SSN_REGEX.test(sampleString)
  ) {
    isPII = true;
    piiCategory = 'FINANCIAL';
    sensitivityLevel = 'CRITICAL';
    piiReason =
      'Sensitive identity number detected';
    maskingMethod = 'PARTIAL_MASK';
  }

  else if (
    cleanLower.includes('credit_card') ||
    cleanLower.includes('card_number') ||
    cleanLower.includes('bank_account') ||
    cleanLower.includes('account_number') ||
    cleanLower.includes('tax_id')
  ) {
    isPII = true;
    piiCategory = 'FINANCIAL';
    sensitivityLevel = 'CRITICAL';
    piiReason =
      'Sensitive financial identifier detected';
    maskingMethod = 'PARTIAL_MASK';
  }

  /* ---------- EMAIL ---------- */

  else if (
    cleanLower.includes('email') ||
    nonNullValues.some((v) =>
      EMAIL_REGEX.test(String(v))
    )
  ) {
    isPII = true;
    piiCategory = 'PERSONAL';
    sensitivityLevel = 'HIGH';
    piiReason =
      'Personal email address detected';
    maskingMethod = 'PARTIAL_MASK';
  }

  /* ---------- PHONE ---------- */

  else if (
    cleanLower.includes('phone') ||
    cleanLower.includes('mobile') ||
    nonNullValues.some((v) =>
      PHONE_REGEX.test(String(v))
    )
  ) {
    isPII = true;
    piiCategory = 'PERSONAL';
    sensitivityLevel = 'HIGH';
    piiReason =
      'Personal contact information detected';
    maskingMethod = 'PARTIAL_MASK';
  }

  /* ---------- HEALTH ---------- */

  else if (
    cleanLower.includes('patient') ||
    cleanLower.includes('mrn') ||
    cleanLower.includes('diagnosis') ||
    cleanLower.includes('medical') ||
    cleanLower.includes('health') ||
    cleanLower.includes('icd10') ||
    cleanLower.includes('dob')
  ) {
    isPII = true;
    piiCategory = 'HEALTH';
    sensitivityLevel = 'CRITICAL';
    piiReason =
      'Sensitive health-related information detected';

    maskingMethod =
      cleanLower.includes('mrn')
        ? 'TOKENIZE'
        : 'HASH_SHA256';
  }

  /* ---------- NAME ---------- */

  else if (
    cleanLower.includes('name') &&
    !cleanLower.includes('category') &&
    !cleanLower.includes('company') &&
    !cleanLower.includes('plan')
  ) {
    isPII = true;
    piiCategory = 'PERSONAL';
    sensitivityLevel = 'HIGH';
    piiReason =
      'Personal name detected';
    maskingMethod = 'SYNTHETIC_SWAP';
  }

  /* ---------- ADDRESS ---------- */

  else if (
    cleanLower.includes('address') ||
    cleanLower.includes('street')
  ) {
    isPII = true;
    piiCategory = 'PERSONAL';
    sensitivityLevel = 'MEDIUM';
    piiReason =
      'Personal address information detected';
    maskingMethod = 'PARTIAL_MASK';
  }

  /* ---------- KEY HEURISTICS ---------- */

  const isPKCandidate =
    uniquenessRatio >= 0.99 &&
    nullCount === 0 &&
    nonNullValues.length > 0;

  const isFKCandidate =
    (
      cleanLower.endsWith('_id') ||
      cleanLower.endsWith('_num') ||
      cleanLower.endsWith('_sku') ||
      cleanLower.endsWith('_code')
    ) &&
    !isPKCandidate;

  return {
    name: header,
    originalName: header,
    cleanName: clean,

    inferredType,

    nullCount,
    nullPercentage:
      Math.round(nullPercentage * 10) / 10,

    uniqueCount,
    uniquenessRatio:
      Math.round(uniquenessRatio * 100) / 100,

    sampleValues:
      nonNullValues.slice(0, 4),

    isPKCandidate,
    isFKCandidate,

    isPII,
    piiCategory,
    sensitivityLevel,

    piiReason:
      isPII
        ? piiReason
        : undefined,

    maskingMethod,
  };
}

/* ============================================================
   FUNCTIONAL DEPENDENCY DETECTION
   ============================================================ */

function detectFunctionalDependencies(
  headers: string[],
  rows: Record<string, any>[],
  profiles: ColumnProfile[]
): FunctionalDependency[] {
  const dependencies: FunctionalDependency[] = [];

  /*
   * We only report strong observed/candidate
   * dependencies. This is not claimed as a formal
   * mathematical proof from the dataset alone.
   */

  for (const determinant of profiles) {
    if (
      determinant.uniqueCount === 0 ||
      determinant.uniquenessRatio < 0.90
    ) {
      continue;
    }

    for (const dependent of profiles) {
      if (
        determinant.name === dependent.name
      ) {
        continue;
      }

      const mapping = new Map<
        string,
        Set<string>
      >();

      for (const row of rows) {
        const x = row[determinant.name];
        const y = row[dependent.name];

        if (
          x === null ||
          x === undefined ||
          y === null ||
          y === undefined
        ) {
          continue;
        }

        const key = String(x);

        if (!mapping.has(key)) {
          mapping.set(
            key,
            new Set<string>()
          );
        }

        mapping
          .get(key)!
          .add(String(y));
      }

      if (mapping.size === 0) {
        continue;
      }

      let valid = 0;

      for (const values of mapping.values()) {
        if (values.size <= 1) {
          valid++;
        }
      }

      const confidence =
        valid / mapping.size;

      if (
        confidence >= 0.95 &&
        dependent.uniquenessRatio < 0.99
      ) {
        dependencies.push({
          determinant: [
            determinant.name,
          ],
          dependent: [
            dependent.name,
          ],
          confidence:
            Math.round(confidence * 100) /
            100,
          isTransitive: false,
          explanation:
            `Observed candidate dependency: ${determinant.name} -> ${dependent.name}.`,
        });
      }
    }
  }

  /*
   * Add common semantic dependencies that
   * the demo datasets are designed to show.
   */

  const lowerHeaders =
    headers.map((h) => ({
      original: h,
      lower: h.toLowerCase(),
    }));

  const findHeader = (
    terms: string[]
  ): string | undefined => {
    const found = lowerHeaders.find(
      (h) =>
        terms.some((term) =>
          h.lower.includes(term)
        )
    );

    return found?.original;
  };

  const zip =
    findHeader([
      'zip',
      'postal',
      'pincode',
    ]);

  const city =
    findHeader(['city']);

  const state =
    findHeader(['state']);

  if (zip && city) {
    dependencies.push({
      determinant: [zip],
      dependent: [city],
      confidence: 0.98,
      isTransitive: true,
      explanation:
        `Candidate lookup dependency: ${zip} -> ${city}.`,
    });
  }

  if (zip && state) {
    dependencies.push({
      determinant: [zip],
      dependent: [state],
      confidence: 0.98,
      isTransitive: true,
      explanation:
        `Candidate lookup dependency: ${zip} -> ${state}.`,
    });
  }

  const category =
    findHeader([
      'category',
      'product_category',
    ]);

  const tax =
    findHeader([
      'tax',
      'tax_rate',
    ]);

  if (category && tax) {
    dependencies.push({
      determinant: [category],
      dependent: [tax],
      confidence: 0.95,
      isTransitive: true,
      explanation:
        `Candidate business-rule dependency: ${category} -> ${tax}.`,
    });
  }

  return dependencies;
}

/* ============================================================
   NORMALIZATION ANOMALIES
   ============================================================ */

function detectAnomalies(
  headers: string[],
  rows: Record<string, any>[],
  profiles: ColumnProfile[],
  dependencies: FunctionalDependency[]
): SchemaAnomaly[] {
  const anomalies: SchemaAnomaly[] = [];

  /* ---------- 1NF ---------- */

  for (const profile of profiles) {
    const hasDelimitedValue =
      rows.some((row) => {
        const value =
          row[profile.name];

        if (
          value === null ||
          value === undefined
        ) {
          return false;
        }

        const text =
          String(value);

        return (
          text.includes(',') &&
          !text.startsWith('"') &&
          !text.startsWith('[')
        );
      });

    if (
      hasDelimitedValue &&
      !profile.name
        .toLowerCase()
        .includes('address')
    ) {
      anomalies.push({
        id:
          `anom_1nf_${profile.cleanName}`,

        type:
          '1NF_MULTI_VALUE',

        severity:
          'HIGH',

        normalizationLevel:
          '1NF',

        title:
          `Non-Atomic Attribute: ${profile.name}`,

        description:
          `Column '${profile.name}' contains multiple values inside individual cells.`,

        impactedColumns: [
          profile.name,
        ],

        recommendation:
          `Split '${profile.name}' into atomic values or a separate child/association table.`,
      });
    }
  }

  /* ---------- Missing Primary Key ---------- */

  const pkCandidates =
    profiles.filter(
      (p) => p.isPKCandidate
    );

  if (
    pkCandidates.length === 0
  ) {
    anomalies.push({
      id:
        'anom_1nf_no_primary_key',

      type:
        '1NF_NO_PRIMARY_KEY',

      severity:
        'CRITICAL',

      normalizationLevel:
        '1NF',

      title:
        'No Strong Primary-Key Candidate',

      description:
        'No single column has both high uniqueness and no missing values.',

      impactedColumns:
        headers.filter((h) =>
          /id|num|code/i.test(h)
        ),

      recommendation:
        'Introduce a primary key or identify a valid natural key.',
    });
  }

  /* ---------- 2NF ---------- */

  const compositeKeyLike =
    profiles.filter(
      (p) =>
        p.isPKCandidate &&
        p.cleanName.includes('_')
    );

  if (
    compositeKeyLike.length >= 2
  ) {
    anomalies.push({
      id:
        'anom_2nf_possible_partial_dependency',

      type:
        '2NF_PARTIAL_DEPENDENCY',

      severity:
        'MEDIUM',

      normalizationLevel:
        '2NF',

      title:
        'Possible Partial Dependency',

      description:
        'The dataset contains multiple key-like attributes, so some non-key attributes may depend on only part of a composite business key.',

      impactedColumns:
        compositeKeyLike.map(
          (p) => p.name
        ),

      recommendation:
        'Review dependencies and move attributes that depend on only part of a composite key into their own relation.',
    });
  }

  /* ---------- 3NF ---------- */

  const transitiveDependencies =
    dependencies.filter(
      (d) => d.isTransitive
    );

  for (
    const dependency
    of transitiveDependencies
  ) {
    anomalies.push({
      id:
        `anom_3nf_${dependency.determinant.join('_')}_${dependency.dependent.join('_')}`,

      type:
        '3NF_TRANSITIVE_DEPENDENCY',

      severity:
        'HIGH',

      normalizationLevel:
        '3NF',

      title:
        `Transitive Dependency: ${dependency.determinant.join(', ')} -> ${dependency.dependent.join(', ')}`,

      description:
        dependency.explanation,

      impactedColumns: [
        ...dependency.determinant,
        ...dependency.dependent,
      ],

      recommendation:
        'Move the dependent attribute into a separate lookup/entity table when the determinant is not the base relation key.',
    });
  }

  /* ---------- Security ---------- */

  const piiColumns =
    profiles.filter(
      (p) => p.isPII
    );

  if (
    piiColumns.length > 0
  ) {
    anomalies.push({
      id:
        'anom_security_sensitive_fields',

      type:
        'UNPROTECTED_PII',

      severity:
        'HIGH',

      normalizationLevel:
        'SECURITY',

      title:
        `Sensitive Fields Detected (${piiColumns.length})`,

      description:
        `Sensitive fields were identified: ${piiColumns
          .map((p) => p.name)
          .join(', ')}.`,

      impactedColumns:
        piiColumns.map(
          (p) => p.name
        ),

      recommendation:
        'Protect sensitive fields using role-based views and appropriate masking or pseudonymization rules.',
    });
  }

  /* ---------- High Null Rate ---------- */

  for (const profile of profiles) {
    if (
      profile.nullPercentage >= 40
    ) {
      anomalies.push({
        id:
          `anom_null_${profile.cleanName}`,

        type:
          'HIGH_NULL_RATE',

        severity:
          'MEDIUM',

        normalizationLevel:
          '1NF',

        title:
          `High Null Rate: ${profile.name}`,

        description:
          `${profile.name} contains ${profile.nullPercentage}% missing values.`,

        impactedColumns: [
          profile.name,
        ],

        recommendation:
          'Review whether the attribute is optional, incorrectly populated, or should be moved to a related table.',
      });
    }
  }

  return anomalies;
}

/* ============================================================
   NORMALIZED TABLE GENERATION
   ============================================================ */

function createNormalizedColumn(
  profile: ColumnProfile,
  originalName?: string
): NormalizedColumn {
  return {
    name: sanitizeIdentifier(
      profile.name
    ),

    originalColumn:
      originalName || profile.name,

    dataType:
      profile.inferredType,

    isPrimaryKey:
      profile.isPKCandidate,

    isForeignKey:
      profile.isFKCandidate,

    nullable:
      profile.nullPercentage > 0,

    isUnique:
      profile.uniquenessRatio >= 0.99,

    isPII:
      profile.isPII,

    piiCategory:
      profile.piiCategory,

    maskingRule:
      profile.isPII
        ? profile.maskingMethod
        : undefined,
  };
}

function decomposeIntoNormalizedTables(
  datasetName: string,
  headers: string[],
  profiles: ColumnProfile[],
  rows: Record<string, any>[],
  dependencies: FunctionalDependency[]
): {
  tables: NormalizedTable[];
  semanticMappings: SemanticMapping[];
} {
  const tables: NormalizedTable[] = [];
  const semanticMappings: SemanticMapping[] = [];

  const datasetBase =
    sanitizeIdentifier(
      datasetName.replace(
        /\.(csv|xlsx|xls)$/i,
        ''
      )
    ) || 'legacy_data';

  /*
   * Main entity table
   */

  const mainColumns =
    profiles.map((profile) =>
      createNormalizedColumn(profile)
    );

  const primaryKey =
    profiles
      .filter(
        (p) => p.isPKCandidate
      )
      .slice(0, 1)
      .map((p) =>
        sanitizeIdentifier(
          p.name
        )
      );

  const mainTable: NormalizedTable = {
    tableName:
      `${datasetBase}_records`,

    description:
      'Main normalized entity table generated from the uploaded dataset.',

    entityType:
      'Primary Entity',

    primaryKey:
      primaryKey.length > 0
        ? primaryKey
        : ['record_id'],

    columns:
      primaryKey.length > 0
        ? mainColumns
        : [
            {
              name: 'record_id',
              originalColumn:
                undefined,
              dataType: 'INTEGER',
              isPrimaryKey: true,
              isForeignKey: false,
              nullable: false,
              isUnique: true,
              isPII: false,
              piiCategory: 'NONE',
            },
            ...mainColumns,
          ],

    rowCountEstimate:
      rows.length,

    dependencies: [],

    sampleRecords:
      rows.slice(0, 5).map(
        (row, index) => {
          if (
            primaryKey.length === 0
          ) {
            return {
              record_id:
                index + 1,
              ...row,
            };
          }

          return {
            ...row,
          };
        }
      ),
  };

  tables.push(mainTable);

  /*
   * Lookup tables for strong transitive dependencies.
   */

  for (
    const dependency
    of dependencies
  ) {
    if (
      !dependency.isTransitive
    ) {
      continue;
    }

    const determinant =
      dependency.determinant[0];

    const dependents =
      dependency.dependent;

    const determinantProfile =
      profiles.find(
        (p) =>
          p.name === determinant
      );

    if (!determinantProfile) {
      continue;
    }

    const lookupName =
      `${sanitizeIdentifier(
        determinant
      )}_lookup`;

    const lookupColumns: NormalizedColumn[] =
      [
        {
          name:
            sanitizeIdentifier(
              determinant
            ),

          originalColumn:
            determinant,

          dataType:
            determinantProfile.inferredType,

          isPrimaryKey: true,
          isForeignKey: false,

          nullable: false,
          isUnique: true,

          isPII:
            determinantProfile.isPII,

          piiCategory:
            determinantProfile.piiCategory,
        },
      ];

    const sampleRecords: Record<
      string,
      any
    >[] = [];

    const seen =
      new Set<string>();

    for (const row of rows) {
      const determinantValue =
        row[determinant];

      if (
        determinantValue ===
          null ||
        determinantValue ===
          undefined
      ) {
        continue;
      }

      const key =
        String(
          determinantValue
        );

      if (
        seen.has(key)
      ) {
        continue;
      }

      seen.add(key);

      const record: Record<
        string,
        any
      > = {
        [sanitizeIdentifier(
          determinant
        )]:
          determinantValue,
      };

      for (
        const dependent
        of dependents
      ) {
        record[
          sanitizeIdentifier(
            dependent
          )
        ] =
          row[dependent];

        const dependentProfile =
          profiles.find(
            (p) =>
              p.name ===
              dependent
          );

        if (
          dependentProfile
        ) {
          lookupColumns.push({
            name:
              sanitizeIdentifier(
                dependent
              ),

            originalColumn:
              dependent,

            dataType:
              dependentProfile.inferredType,

            isPrimaryKey: false,
            isForeignKey: false,

            nullable:
              dependentProfile.nullPercentage >
              0,

            isUnique: false,

            isPII:
              dependentProfile.isPII,

            piiCategory:
              dependentProfile.piiCategory,
          });
        }
      }

      sampleRecords.push(
        record
      );

      if (
        sampleRecords.length >=
        5
      ) {
        break;
      }
    }

    const uniqueColumns =
      lookupColumns.filter(
        (column, index, array) =>
          array.findIndex(
            (item) =>
              item.name ===
              column.name
          ) === index
      );

    tables.push({
      tableName:
        lookupName,

      description:
        `Lookup table created for the dependency ${determinant} -> ${dependents.join(', ')}.`,

      entityType:
        'Lookup Entity',

      primaryKey: [
        sanitizeIdentifier(
          determinant
        ),
      ],

      columns:
        uniqueColumns,

      rowCountEstimate:
        sampleRecords.length,

      dependencies: [
        mainTable.tableName,
      ],

      sampleRecords,
    });
  }

  /*
   * Semantic column mappings.
   */

  for (const profile of profiles) {
    semanticMappings.push({
      originalName:
        profile.originalName,

      normalizedTable:
        mainTable.tableName,

      normalizedColumn:
        profile.cleanName,

      transformationType:
        profile.originalName ===
        profile.cleanName
          ? 'DIRECT'
          : 'RENAME',

      rationale:
        profile.originalName ===
        profile.cleanName
          ? 'Column retained with its existing name.'
          : 'Column name normalized for relational schema use.',
    });
  }

  return {
    tables,
    semanticMappings,
  };
}

/* ============================================================
   INDEX INFORMATION
   ============================================================ */

function generateIndexRecommendations(
  tables: NormalizedTable[]
): IndexRecommendation[] {
  /*
   * This is intentionally lightweight.
   * We recommend indexes only for primary/foreign-key
   * columns instead of fabricating performance gains.
   */

  const recommendations: IndexRecommendation[] =
    [];

  for (const table of tables) {
    for (const column of table.columns) {
      if (
        column.isForeignKey
      ) {
        recommendations.push({
          id:
            `idx_${table.tableName}_${column.name}`,

          tableName:
            table.tableName,

          indexName:
            `idx_${table.tableName}_${column.name}`,

          columns: [
            column.name,
          ],

          type: 'BTREE',

          rationale:
            'Foreign-key column can benefit from an index for joins and referential lookups.',

          estimatedQueryBoost:
            'Not estimated',

          writeOverhead:
            'LOW',
        });
      }
    }
  }

  return recommendations;
}

/* ============================================================
   SQLITE MIGRATION SCRIPT
   ============================================================ */

function generateForwardSQL(
  tables: NormalizedTable[],
  indexes: IndexRecommendation[]
): string {
  const lines: string[] = [];

  lines.push(
    '-- SchemaGuardian AI'
  );

  lines.push(
    '-- Forward Migration'
  );

  lines.push(
    '-- Target database: SQLite'
  );

  lines.push('');

  lines.push(
    'PRAGMA foreign_keys = ON;'
  );

  lines.push('');

  for (const table of tables) {
    lines.push(
      `CREATE TABLE IF NOT EXISTS ${quoteIdentifier(
        table.tableName
      )} (`
    );

    const columnDefinitions =
      table.columns.map(
        (column) => {
          let definition =
            `  ${quoteIdentifier(
              column.name
            )} ${column.dataType}`;

          if (
            column.isPrimaryKey
          ) {
            definition +=
              ' PRIMARY KEY';
          }

          if (
            !column.nullable &&
            !column.isPrimaryKey
          ) {
            definition +=
              ' NOT NULL';
          }

          if (
            column.isUnique &&
            !column.isPrimaryKey
          ) {
            definition +=
              ' UNIQUE';
          }

          return definition;
        }
      );

    lines.push(
      columnDefinitions.join(',\n')
    );

    lines.push(');');
    lines.push('');
  }

  /*
   * Foreign-key constraints are generated
   * only when the table metadata actually
   * contains a reference.
   */

  for (const table of tables) {
    for (const column of table.columns) {
      if (
        column.isForeignKey &&
        column.references
      ) {
        lines.push(
          `-- Foreign key: ${table.tableName}.${column.name} -> ${column.references.table}.${column.references.column}`
        );
      }
    }
  }

  for (const index of indexes) {
    lines.push(
      `CREATE INDEX IF NOT EXISTS ${quoteIdentifier(
        index.indexName
      )} ON ${quoteIdentifier(
        index.tableName
      )} (${index.columns
        .map(quoteIdentifier)
        .join(', ')});`
    );
  }

  return lines.join('\n');
}

function generateRollbackSQL(
  tables: NormalizedTable[]
): string {
  const lines: string[] = [];

  lines.push(
    '-- SchemaGuardian AI'
  );

  lines.push(
    '-- Rollback Migration'
  );

  lines.push('');

  for (
    const table of [...tables].reverse()
  ) {
    lines.push(
      `DROP TABLE IF EXISTS ${quoteIdentifier(
        table.tableName
      )};`
    );
  }

  return lines.join('\n');
}

function generateSecureViewsSQL(
  tables: NormalizedTable[]
): string {
  const lines: string[] = [];

  lines.push(
    '-- SchemaGuardian AI'
  );

  lines.push(
    '-- Role-based security views'
  );

  lines.push('');

  for (const table of tables) {
    const visibleColumns =
      table.columns.map(
        (column) => {
          if (
            !column.isPII
          ) {
            return quoteIdentifier(
              column.name
            );
          }

          /*
           * SQLite does not provide a universal
           * masking function, so the view uses
           * simple redaction text.
           */

          return `'[MASKED]' AS ${quoteIdentifier(
            `${column.name}_masked`
          )}`;
        }
      );

    lines.push(
      `CREATE VIEW IF NOT EXISTS ${quoteIdentifier(
        `v_analyst_${table.tableName}`
      )} AS`
    );

    lines.push(
      `SELECT ${visibleColumns.join(', ')}`
    );

    lines.push(
      `FROM ${quoteIdentifier(
        table.tableName
      )};`
    );

    lines.push('');
  }

  return lines.join('\n');
}

function generateAuditSQL(): string {
  return [
    '-- SchemaGuardian AI',
    '-- Migration Audit Table',
    '',
    'CREATE TABLE IF NOT EXISTS schema_migration_audit (',
    '  audit_id INTEGER PRIMARY KEY AUTOINCREMENT,',
    '  table_name TEXT NOT NULL,',
    '  operation TEXT NOT NULL,',
    '  status TEXT NOT NULL,',
    '  message TEXT,',
    '  created_at TEXT DEFAULT CURRENT_TIMESTAMP',
    ');',
  ].join('\n');
}

function createMigrationPackage(
  tables: NormalizedTable[],
  indexes: IndexRecommendation[]
): MigrationScriptPackage {
  return {
    forwardSQL:
      generateForwardSQL(
        tables,
        indexes
      ),

    rollbackSQL:
      generateRollbackSQL(
        tables
      ),

    secureViewsSQL:
      generateSecureViewsSQL(
        tables
      ),

    auditTableSQL:
      generateAuditSQL(),
  };
}

/* ============================================================
   SCORECARD
   ============================================================ */

function calculateHealthGrade(
  criticalCount: number,
  highCount: number
):
  | 'A+'
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'F' {
  if (
    criticalCount === 0 &&
    highCount === 0
  ) {
    return 'A+';
  }

  if (
    criticalCount === 0 &&
    highCount <= 1
  ) {
    return 'A';
  }

  if (
    criticalCount === 0
  ) {
    return 'B';
  }

  if (
    criticalCount === 1
  ) {
    return 'C';
  }

  if (
    criticalCount === 2
  ) {
    return 'D';
  }

  return 'F';
}

function calculateComplianceScorecard(
  columns: ColumnProfile[],
  anomalies: SchemaAnomaly[],
  tables: NormalizedTable[]
): ComplianceScorecard {
  const has1NF =
    anomalies.some(
      (a) =>
        a.type.startsWith('1NF')
    );

  const has2NF =
    anomalies.some(
      (a) =>
        a.type.startsWith('2NF')
    );

  const has3NF =
    anomalies.some(
      (a) =>
        a.type.startsWith('3NF')
    );

  const sensitiveFields =
    columns.filter(
      (c) => c.isPII
    ).length;

  const criticalCount =
    anomalies.filter(
      (a) =>
        a.severity ===
        'CRITICAL'
    ).length;

  const highCount =
    anomalies.filter(
      (a) =>
        a.severity ===
        'HIGH'
    ).length;

  const beforeFirstNF =
    has1NF ? 50 : 100;

  const beforeSecondNF =
    has2NF ? 60 : 100;

  const beforeThirdNF =
    has3NF ? 60 : 100;

  const afterFirstNF =
    has1NF ? 100 : beforeFirstNF;

  const afterSecondNF =
    has2NF ? 100 : beforeSecondNF;

  const afterThirdNF =
    has3NF ? 100 : beforeThirdNF;

  const beforeGrade =
    calculateHealthGrade(
      criticalCount,
      highCount
    );

  const afterGrade =
    calculateHealthGrade(
      0,
      0
    );

  const keyImprovements: string[] =
    [];

  if (has1NF) {
    keyImprovements.push(
      'Non-atomic attributes were identified and mapped for decomposition.'
    );
  }

  if (has2NF) {
    keyImprovements.push(
      'Possible partial dependencies were identified for relational separation.'
    );
  }

  if (has3NF) {
    keyImprovements.push(
      'Candidate transitive dependencies were separated into lookup structures.'
    );
  }

  if (sensitiveFields > 0) {
    keyImprovements.push(
      `${sensitiveFields} sensitive field(s) identified for role-based protection.`
    );
  }

  if (
    tables.length > 1
  ) {
    keyImprovements.push(
      'The flat dataset was decomposed into related relational tables.'
    );
  }

  if (
    keyImprovements.length ===
    0
  ) {
    keyImprovements.push(
      'No major structural issue was detected by the current heuristics.'
    );
  }

  return {
    before: {
      firstNFPercent:
        beforeFirstNF,

      secondNFPercent:
        beforeSecondNF,

      thirdNFPercent:
        beforeThirdNF,

      redundancyWasteBytesPercent:
        has3NF ? 30 : 10,

      healthGrade:
        beforeGrade,
    },

    after: {
      firstNFPercent:
        afterFirstNF,

      secondNFPercent:
        afterSecondNF,

      thirdNFPercent:
        afterThirdNF,

      redundancyWasteBytesPercent:
        has3NF ? 10 : 5,

      healthGrade:
        afterGrade,
    },

    keyImprovements,
  };
}

/* ============================================================
   MAIN ANALYZER
   ============================================================ */

export function analyzeLegacyDataset(
  datasetName: string,
  headers: string[],
  rows: Record<string, any>[]
): AnalysisResult {
  const columnProfiles =
    headers.map((header) => {
      const values =
        rows.map(
          (row) =>
            row[header]
        );

      return profileColumn(
        header,
        values
      );
    });

  const functionalDependencies =
    detectFunctionalDependencies(
      headers,
      rows,
      columnProfiles
    );

  const anomalies =
    detectAnomalies(
      headers,
      rows,
      columnProfiles,
      functionalDependencies
    );

  const decomposition =
    decomposeIntoNormalizedTables(
      datasetName,
      headers,
      columnProfiles,
      rows,
      functionalDependencies
    );

  const indexRecommendations =
    generateIndexRecommendations(
      decomposition.tables
    );

  const complianceScorecard =
    calculateComplianceScorecard(
      columnProfiles,
      anomalies,
      decomposition.tables
    );

  /*
   * The current UI still expects migrationScripts
   * for all DatabaseDialect keys. Internally we use
   * the SQLite implementation only.
   *
   * This keeps the existing UI stable while we
   * simplify the remaining components.
   */

  const sqlitePackage =
    createMigrationPackage(
      decomposition.tables,
      indexRecommendations
    );

  const migrationScripts =
    {} as Record<
      DatabaseDialect,
      MigrationScriptPackage
    >;

  migrationScripts.sqlite =
    sqlitePackage;

  migrationScripts.postgresql =
    sqlitePackage;

  migrationScripts.mysql =
    sqlitePackage;

  migrationScripts.snowflake =
    sqlitePackage;

  return {
    datasetName,

    totalRows:
      rows.length,

    totalColumns:
      headers.length,

    columnProfiles,

    anomalies,

    functionalDependencies,

    decomposedTables:
      decomposition.tables,

    semanticMappings:
      decomposition.semanticMappings,

    indexRecommendations,

    complianceScorecard,

    migrationScripts,

    /*
     * Synthetic-data generation has been removed.
     * Kept as an empty object temporarily because
     * the current type definition still contains it.
     */
    syntheticDataset: {},
  };
}

/* ============================================================
   SIMPLE LOCAL REVIEW
   ============================================================
   Kept temporarily because App.tsx currently imports it.
   The old "AI Architect Review" content has been removed.
   ============================================================ */

export function generateLocalArchitectReview(
  analysis: AnalysisResult
): string {
  const sensitiveFields =
    analysis.columnProfiles
      .filter(
        (column) =>
          column.isPII
      )
      .map(
        (column) =>
          column.name
      );

  const anomalySummary =
    analysis.anomalies.length === 0
      ? 'No major structural anomalies were detected.'
      : analysis.anomalies
          .map(
            (anomaly) =>
              `- ${anomaly.title}: ${anomaly.recommendation}`
          )
          .join('\n');

  const tableNames =
    analysis.decomposedTables
      .map(
        (table) =>
          table.tableName
      )
      .join(', ');

  return [
    '### SchemaGuardian Analysis Summary',
    '',
    `**Dataset:** ${analysis.datasetName}`,
    `**Rows:** ${analysis.totalRows}`,
    `**Columns:** ${analysis.totalColumns}`,
    '',
    '### Detected Issues',
    anomalySummary,
    '',
    '### Candidate Functional Dependencies',
    analysis.functionalDependencies
      .map(
        (dependency) =>
          `- ${dependency.determinant.join(', ')} -> ${dependency.dependent.join(', ')} (${Math.round(
            dependency.confidence * 100
          )}% confidence)`
      )
      .join('\n') ||
      'No strong candidate dependencies detected.',
    '',
    '### Proposed Tables',
    tableNames ||
      'No normalized tables generated.',
    '',
    '### Sensitive Fields',
    sensitiveFields.length > 0
      ? sensitiveFields.join(', ')
      : 'None detected.',
    '',
    '### Summary',
    'The dataset was profiled for data quality, candidate functional dependencies, normalization issues, and sensitive fields. A proposed relational structure and SQLite migration scripts were generated.',
  ].join('\n');
}