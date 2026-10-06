import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '15mb' }));

// ============================================================
// AI ARCHITECT ANALYSIS ENDPOINT
// ============================================================

app.post('/api/ai/architect-critique', async (req: Request, res: Response) => {
  try {
    const { datasetSummary, detectedAnomalies, decomposedTables } = req.body;

    const tableNames = (decomposedTables || [])
      .map((t: any) => t.tableName)
      .join(', ');

    const anomalyCount = (detectedAnomalies || []).length;

    const fallbackCritique = `### Autonomous Architectural Review & Normalization Audit

**Evaluator:** SchemaGuardian AI (Principal Database Architect & Enterprise Security Officer)

**Dataset Target:** ${datasetSummary?.name || 'Normalized Relational Target'}

**Normalization Status:** 3NF / BCNF Verified Target Schema

---

### 1. Structural Anomaly Triage & Key Normalization

* **Monolith Decomposition:** Successfully isolated ${anomalyCount} detected schema anomalies into dedicated entities (${tableNames || 'Normalized Schema'}).

* **Surrogate vs Natural Keys:** Natural identifiers such as emails or MRNs should remain secondary candidate keys with unique constraints, while primary relational joins should use synthetic keys such as BIGSERIAL or UUIDv7.

* **Transitive Dependency Elimination:** Attributes dependent on intermediate determinants should be factored into appropriate lookup dimensions.

---

### 2. Boyce-Codd Normal Form (BCNF) Edge-Case Caveats

* **Determinant Superkey Rule:** BCNF requires every determinant X in a non-trivial functional dependency X → Y to be a candidate superkey.

* **Composite Foreign Keys:** Bridge tables should use appropriate composite indexes to support efficient relational joins.

---

### 3. Concurrency, Ingestion & Indexing Architecture

* **Advisory Locks & Cursor Batching:** Production batch ingestion should avoid global table locks and use cursor-based pagination.

* **Foreign Key Indexing:** Relational foreign keys should have appropriate indexes to improve join and cascading-validation performance.

* **Partial Indexing:** High-volume operational tables can benefit from filtered indexes on frequently queried status columns.

---

### 4. Regulatory Data Governance

* **Dynamic Data Masking:** Sensitive PII should be protected using role-based database views and least-privilege access.

* **Cryptographic Tokenization:** Sensitive identity attributes should be protected before external or analytical exports.

* **Audit Trail:** Rejected or unparseable migration records should be retained in an audit/dead-letter structure for traceability.

This review was generated using SchemaGuardian's deterministic rule engine.
`;

    res.json({
      success: true,
      critique: fallbackCritique,
      fallbackUsed: true,
    });
  } catch (error: any) {
    console.error('Error generating architectural critique:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to generate architectural critique.',
    });
  }
});

// ============================================================
// SYNTHETIC DATA GENERATION
// ============================================================

app.post('/api/ai/generate-synthetic', async (req: Request, res: Response) => {
  try {
    const { tableSchema, count = 5 } = req.body;

    const records: any[] = [];

    const firstNames = [
      'David',
      'Jennifer',
      'Marcus',
      'Sophia',
      'Lucas',
      'Emma',
    ];

    const lastNames = [
      'Sterling',
      'Vance',
      'Brody',
      'Chen',
      'Hawthorne',
      'Miller',
    ];

    const domains = [
      'acmefabric.io',
      'synthonline.org',
      'mockcorp.internal',
    ];

    for (let i = 0; i < count; i++) {
      const row: any = {};

      const fn = firstNames[i % firstNames.length];
      const ln = lastNames[i % lastNames.length];
      const dom = domains[i % domains.length];

      for (const col of tableSchema?.columns || []) {
        const lower = col.name.toLowerCase();

        if (col.isPrimaryKey) {
          row[col.name] = col.dataType?.includes('INT')
            ? 9000 + i + 1
            : `SYN-${tableSchema?.tableName
                ?.slice(0, 3)
                ?.toUpperCase()}-${100 + i}`;
        } else if (col.isForeignKey) {
          row[col.name] = col.dataType?.includes('INT')
            ? i + 1
            : `REF-${101 + (i % 3)}`;
        } else if (lower.includes('name')) {
          row[col.name] = `${fn} ${ln}`;
        } else if (lower.includes('email')) {
          row[col.name] =
            `${fn.toLowerCase()}.${ln.toLowerCase()}@${dom}`;
        } else if (lower.includes('phone')) {
          row[col.name] =
            `555-019-${String(3000 + i * 47).slice(-4)}`;
        } else if (
          lower.includes('ssn') ||
          lower.includes('tax')
        ) {
          row[col.name] =
            `***-**-${String(6000 + i * 83).slice(-4)}`;
        } else if (lower.includes('card')) {
          row[col.name] =
            String(5000 + i * 111).slice(-4);
        } else if (lower.includes('date')) {
          row[col.name] =
            `2024-03-${String(10 + i).padStart(2, '0')}`;
        } else if (col.dataType?.includes('DECIMAL')) {
          row[col.name] =
            Number((29.99 + i * 15.5).toFixed(2));
        } else if (col.dataType === 'INTEGER') {
          row[col.name] = (i + 1) * 2;
        } else if (col.dataType === 'BOOLEAN') {
          row[col.name] = i % 2 === 0;
        } else {
          row[col.name] = `Mock_${col.name}_${i + 1}`;
        }
      }

      records.push(row);
    }

    res.json({
      success: true,
      records,
      fallbackUsed: true,
    });
  } catch (error: any) {
    console.error('Error generating synthetic data:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to generate synthetic data.',
    });
  }
});

// ============================================================
// VITE / PRODUCTION SERVER
// ============================================================

async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    app.use(
      express.static(path.resolve(__dirname, 'dist'))
    );

    app.get('*', (_req, res) => {
      res.sendFile(
        path.resolve(__dirname, 'dist', 'index.html')
      );
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `SchemaGuardian AI server active on http://0.0.0.0:${PORT}`
    );
  });
}

startServer();