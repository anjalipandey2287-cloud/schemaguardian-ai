export type DatabaseDialect = 'postgresql' | 'mysql' | 'sqlite' | 'snowflake';

export type InferredDataType =
  | 'INTEGER'
  | 'BIGINT'
  | 'DECIMAL(12,2)'
  | 'VARCHAR(255)'
  | 'TEXT'
  | 'BOOLEAN'
  | 'TIMESTAMP'
  | 'DATE'
  | 'UUID'
  | 'JSON';

export type PIICategory =
  | 'PERSONAL'
  | 'HEALTH'
  | 'FINANCIAL'
  | 'INTERNAL'
  | 'NONE';

export type SensitivityLevel =
  | 'CRITICAL'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'PUBLIC';

export interface ColumnProfile {
  name: string;
  originalName: string;
  cleanName: string;
  inferredType: InferredDataType;

  nullCount: number;
  nullPercentage: number;

  uniqueCount: number;
  uniquenessRatio: number;

  sampleValues: any[];

  isPKCandidate: boolean;
  isFKCandidate: boolean;
  potentialFKTarget?: string;

  isPII: boolean;
  piiCategory: PIICategory;
  sensitivityLevel: SensitivityLevel;
  piiReason?: string;

  maskingMethod:
    | 'HASH_SHA256'
    | 'PARTIAL_MASK'
    | 'TOKENIZE'
    | 'NULLIFY'
    | 'SYNTHETIC_SWAP'
    | 'NONE';
}

export type AnomalyType =
  | '1NF_MULTI_VALUE'
  | '1NF_REPEATING_GROUP'
  | '1NF_NO_PRIMARY_KEY'
  | '2NF_PARTIAL_DEPENDENCY'
  | '3NF_TRANSITIVE_DEPENDENCY'
  | 'DATA_TYPE_MISMATCH'
  | 'UNPROTECTED_PII'
  | 'HIGH_NULL_RATE'
  | 'CASE_INCONSISTENCY';

export interface SchemaAnomaly {
  id: string;
  type: AnomalyType;

  severity:
    | 'CRITICAL'
    | 'HIGH'
    | 'MEDIUM'
    | 'LOW';

  title: string;
  description: string;
  impactedColumns: string[];
  recommendation: string;

  normalizationLevel:
    | '1NF'
    | '2NF'
    | '3NF'
    | 'SECURITY';
}

export interface FunctionalDependency {
  determinant: string[];
  dependent: string[];

  // Observed/candidate dependency confidence
  confidence: number;

  isTransitive: boolean;
  explanation: string;
}

export interface NormalizedColumn {
  name: string;
  originalColumn?: string;
  dataType: InferredDataType;

  isPrimaryKey: boolean;
  isForeignKey: boolean;

  references?: {
    table: string;
    column: string;
  };

  nullable: boolean;
  isUnique: boolean;

  defaultValue?: string;

  isPII: boolean;
  piiCategory: PIICategory;
  maskingRule?: string;
}

export interface NormalizedTable {
  tableName: string;
  description: string;
  entityType: string;

  primaryKey: string[];

  columns: NormalizedColumn[];

  rowCountEstimate: number;

  // References/dependencies between normalized tables
  dependencies: string[];

  sampleRecords: Record<string, any>[];
}

export interface SemanticMapping {
  originalName: string;

  normalizedTable: string;
  normalizedColumn: string;

  transformationType:
    | 'DIRECT'
    | 'RENAME'
    | 'NORMALIZE_ID'
    | 'SPLIT_ATOM'
    | 'HASH_MASK';

  rationale: string;
}

/*
 * Kept temporarily for compatibility with the existing analyzer.
 * We will simplify/remove index recommendations from the UI and
 * analyzer in the next step.
 */
export interface IndexRecommendation {
  id: string;
  tableName: string;
  indexName: string;
  columns: string[];

  type:
    | 'BTREE'
    | 'COMPOSITE'
    | 'HASH'
    | 'PARTIAL';

  whereClause?: string;
  rationale: string;
  estimatedQueryBoost: string;

  writeOverhead:
    | 'NEGLIGIBLE'
    | 'LOW'
    | 'MEDIUM';
}

/*
 * Kept temporarily because the current analyzer still references it.
 * It will be removed when migration batching logic is simplified.
 */
export interface BatchingConfig {
  batchSize: number;
  pauseIntervalMs: number;
  enableDeadLetterLogging: boolean;
  lockTimeoutSeconds: number;
  cursorColumn: string;
}

/*
 * Simplified security/normalization scorecard.
 * Regulatory compliance is intentionally not claimed.
 */
export interface ComplianceScorecard {
  before: {
    firstNFPercent: number;
    secondNFPercent: number;
    thirdNFPercent: number;

    redundancyWasteBytesPercent: number;

    healthGrade:
      | 'A+'
      | 'A'
      | 'B'
      | 'C'
      | 'D'
      | 'F';
  };

  after: {
    firstNFPercent: number;
    secondNFPercent: number;
    thirdNFPercent: number;

    redundancyWasteBytesPercent: number;

    healthGrade:
      | 'A+'
      | 'A'
      | 'B'
      | 'C'
      | 'D'
      | 'F';
  };

  keyImprovements: string[];
}

export type UserRole =
  | 'ADMIN'
  | 'SUPPORT_AGENT'
  | 'DATA_ANALYST';

export interface RBACRoleConfig {
  role: UserRole;

  label: string;
  description: string;
  badgeColor: string;

  canViewPII: boolean;

  maskingStyle:
    | 'UNMASKED'
    | 'PARTIAL_REDACT'
    | 'PSEUDONYMIZED_HASH'
    | 'RESTRICTED_ACCESS';
}

export interface MigrationScriptPackage {
  forwardSQL: string;
  rollbackSQL: string;
  secureViewsSQL: string;
  auditTableSQL: string;
}

export interface AnalysisResult {
  datasetName: string;

  totalRows: number;
  totalColumns: number;

  columnProfiles: ColumnProfile[];

  anomalies: SchemaAnomaly[];

  functionalDependencies: FunctionalDependency[];

  decomposedTables: NormalizedTable[];

  semanticMappings: SemanticMapping[];

  indexRecommendations: IndexRecommendation[];

  complianceScorecard: ComplianceScorecard;

  migrationScripts: Record<
    DatabaseDialect,
    MigrationScriptPackage
  >;

  /*
   * Kept temporarily for compatibility.
   * The synthetic-data feature will be removed from the UI
   * and analyzer later.
   */
  syntheticDataset: Record<
    string,
    Record<string, any>[]
  >;
}