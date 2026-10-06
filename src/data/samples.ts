export interface SampleDataset {
  id: string;
  name: string;
  description: string;
  tag: string;
  badgeColor: string;
  rawCSV: string;
}

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: 'ecommerce_monolith',
    name: 'E-Commerce Legacy Orders Monolith',
    description: 'Denormalized transaction dump combining orders, customer PII, address lookups, product catalog, and raw payment cards in single rows.',
    tag: 'Retail / Payments',
    badgeColor: 'amber',
    rawCSV: `order_id,order_date,cust_num,cust_name,cust_email,cust_phone,cust_ssn_last4,shipping_address,shipping_city,shipping_state,shipping_zip,item_sku,item_name,item_category,category_tax_pct,unit_price,quantity,card_last_four,payment_status
ORD-1001,2024-01-15,C-4091,Eleanor Vance,eleanor.vance@hillhouse.org,555-019-2831,4819,142 Elm Terrace,Springfield,IL,62701,SKU-CORE-01,Ergonomic Mechanical Keyboard,Electronics,8.25,129.99,1,4112,COMPLETED
ORD-1001,2024-01-15,C-4091,Eleanor Vance,eleanor.vance@hillhouse.org,555-019-2831,4819,142 Elm Terrace,Springfield,IL,62701,SKU-ACC-09,Wrist Rest Cushion,Accessories,6.00,24.50,1,4112,COMPLETED
ORD-1002,2024-01-16,C-4092,Marcus Brody,mbrody@museum.edu,555-014-9921,7720,89 Crescent Way,Boston,MA,02108,SKU-DISP-44,4K Ultra-Wide Monitor,Electronics,8.25,489.00,1,9931,COMPLETED
ORD-1003,2024-01-17,C-4093,Theo Crain,theo.crain@designstudio.io,555-018-3319,1204,450 Sunset Blvd,Los Angeles,CA,90028,SKU-CORE-01,Ergonomic Mechanical Keyboard,Electronics,8.25,129.99,2,8844,COMPLETED
ORD-1003,2024-01-17,C-4093,Theo Crain,theo.crain@designstudio.io,555-018-3319,1204,450 Sunset Blvd,Los Angeles,CA,90028,SKU-CBL-12,Braided USB-C 2M,Accessories,6.00,14.99,3,8844,COMPLETED
ORD-1004,2024-01-18,C-4091,Eleanor Vance,eleanor.vance@hillhouse.org,555-019-2831,4819,142 Elm Terrace,Springfield,IL,62701,SKU-DISP-44,4K Ultra-Wide Monitor,Electronics,8.25,489.00,1,4112,PENDING
ORD-1005,2024-01-19,C-4094,Luke Sanderson,luke.sanderson@rehab.org,555-012-7744,9311,77 Beacon Heights,Springfield,IL,62701,SKU-ACC-09,Wrist Rest Cushion,Accessories,6.00,24.50,2,3018,COMPLETED
ORD-1006,2024-01-20,C-4095,Nell Vance,nell.vance@tranquility.net,555-017-8822,5042,304 Oak Lane,Boston,MA,02108,SKU-AUDIO-88,Noise Canceling Headset,Electronics,8.25,199.95,1,1144,COMPLETED
ORD-1007,2024-01-21,C-4092,Marcus Brody,mbrody@museum.edu,555-014-9921,7720,89 Crescent Way,Boston,MA,02108,SKU-CBL-12,Braided USB-C 2M,Accessories,6.00,14.99,2,9931,REFUNDED
ORD-1008,2024-01-22,C-4096,Arthur Dudley,adudley@lawcorp.com,555-011-5509,6190,52 Pine Ridge,Austin,TX,78701,SKU-CORE-01,Ergonomic Mechanical Keyboard,Electronics,8.25,129.99,1,7201,COMPLETED`,
  },
  {
    id: 'healthcare_claims',
    name: 'Healthcare Encounters & Claims Denormalized',
    description: 'Patient medical encounters with severe HIPAA PHI exposure (MRN, DOB, ICD-10 diagnosis), physician NPIs, and payer details.',
    tag: 'Healthcare / HIPAA',
    badgeColor: 'rose',
    rawCSV: `encounter_id,visit_date,patient_mrn,patient_name,patient_dob,patient_phone,insurance_id,payer_name,payer_claims_phone,provider_npi,physician_name,clinic_department,icd10_code,diagnosis_desc,procedure_charge,copay_amount
ENC-8801,2024-02-01,MRN-90210,Sarah Connor,1984-05-12,555-401-2911,PAY-BLUE-01,BlueCross Horizon,800-555-0101,NPI-1928374650,Dr. Peter Silberman,Cardiology,I10,Essential primary hypertension,450.00,30.00
ENC-8802,2024-02-01,MRN-90211,John Connor,1995-02-28,555-401-3822,PAY-AETNA-02,Aetna Health,800-555-0202,NPI-9847261530,Dr. Miles Dyson,Neurology,G44.1,Vascular headache,520.00,40.00
ENC-8803,2024-02-02,MRN-90212,Kyle Reese,1980-08-15,555-401-9944,PAY-BLUE-01,BlueCross Horizon,800-555-0101,NPI-1928374650,Dr. Peter Silberman,Cardiology,E11.9,Type 2 diabetes mellitus,380.00,25.00
ENC-8804,2024-02-03,MRN-90210,Sarah Connor,1984-05-12,555-401-2911,PAY-BLUE-01,BlueCross Horizon,800-555-0101,NPI-4491028371,Dr. Kathryn Brewster,Orthopedics,M54.5,Low back pain unspecified,610.00,35.00
ENC-8805,2024-02-04,MRN-90213,Tim Fletcher,1992-11-03,555-401-8172,PAY-UNITED-03,United Healthcare,800-555-0303,NPI-9847261530,Dr. Miles Dyson,Neurology,G43.0,Migraine without aura,490.00,40.00
ENC-8806,2024-02-05,MRN-90211,John Connor,1995-02-28,555-401-3822,PAY-AETNA-02,Aetna Health,800-555-0202,NPI-1928374650,Dr. Peter Silberman,Cardiology,I10,Essential primary hypertension,450.00,30.00
ENC-8807,2024-02-06,MRN-90214,Janelle Voight,1976-03-22,555-401-1029,PAY-BLUE-01,BlueCross Horizon,800-555-0101,NPI-4491028371,Dr. Kathryn Brewster,Orthopedics,S83.5,Tear of cruciate ligament,1250.00,50.00`,
  },
  {
    id: 'saas_multitenant',
    name: 'SaaS Multi-Tenant Subscription & Billing Log',
    description: 'B2B subscription log with multi-valued CSV feature tags, plan pricing redundancies, and corporate tax identification numbers.',
    tag: 'B2B SaaS / FinTech',
    badgeColor: 'emerald',
    rawCSV: `invoice_num,billing_period,tenant_id,company_name,primary_contact_email,tax_id_ein,plan_id,plan_tier,monthly_rate,active_seats,overage_rate_per_seat,feature_addons_csv,payment_gateway
INV-2024-001,2024-01,TEN-101,Acme Cybernetics,billing@acmeco.io,12-3456789,PLN-ENT-01,Enterprise,1200.00,45,25.00,"audit_logs,sso_saml,dedicated_ip",Stripe
INV-2024-002,2024-01,TEN-102,Cyberdyne Global,admin@cyberdyne.ai,98-7654321,PLN-PRO-02,Professional,450.00,18,30.00,"sso_saml,api_access",Stripe
INV-2024-003,2024-01,TEN-103,Initech Consulting,peter@initech.com,45-9871234,PLN-STARTER-03,Starter,120.00,5,35.00,"basic_analytics",Braintree
INV-2024-004,2024-02,TEN-101,Acme Cybernetics,billing@acmeco.io,12-3456789,PLN-ENT-01,Enterprise,1200.00,52,25.00,"audit_logs,sso_saml,dedicated_ip,hipaa_vault",Stripe
INV-2024-005,2024-02,TEN-102,Cyberdyne Global,admin@cyberdyne.ai,98-7654321,PLN-PRO-02,Professional,450.00,20,30.00,"sso_saml,api_access",Stripe
INV-2024-006,2024-02,TEN-104,Massive Dynamic,finance@massivedynamic.org,33-1122334,PLN-ENT-01,Enterprise,1200.00,110,25.00,"audit_logs,sso_saml,dedicated_ip",Stripe`,
  },
];
