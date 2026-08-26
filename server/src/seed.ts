import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { CryptoService } from './services/cryptoService';
import { AuditLedgerService } from './services/auditLedgerService';

const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log('🌱 Starting ParikshaTantra Pan-India State & District Ecosystem Seed...');

  // 1. Create Central & State Public Service Commissions / Boards
  const orgsData = [
    { code: 'AUTH-NTA', name: 'National Testing Agency (NTA)', type: 'CENTRAL', description: 'Conducts NEET (UG), JEE (Main), UGC NET, CUET.' },
    { code: 'AUTH-UPSC', name: 'Union Public Service Commission (UPSC)', type: 'CENTRAL', description: 'Conducts Civil Services Examination (CSE), NDA, CDS.' },
    { code: 'AUTH-SSC', name: 'Staff Selection Commission (SSC)', type: 'CENTRAL', description: 'Conducts CGL, CHSL, MTS examinations.' },
    { code: 'AUTH-IBPS', name: 'Institute of Banking Personnel Selection (IBPS)', type: 'CENTRAL', description: 'Conducts Bank PO and Clerk examinations.' },
    { code: 'AUTH-MPSC', name: 'Maharashtra Public Service Commission (MPSC)', type: 'STATE', description: 'State Civil Services Examination authority in Maharashtra.' },
    { code: 'AUTH-UPPSC', name: 'Uttar Pradesh Public Service Commission (UPPSC)', type: 'STATE', description: 'State PCS examination authority in Uttar Pradesh.' },
    { code: 'AUTH-BPSC', name: 'Bihar Public Service Commission (BPSC)', type: 'STATE', description: 'Combined Competitive Examination authority in Bihar.' },
    { code: 'AUTH-WBPSC', name: 'West Bengal Public Service Commission (WBPSC)', type: 'STATE', description: 'West Bengal Civil Service (WBCS) examination board.' },
    { code: 'AUTH-KPSC', name: 'Karnataka Public Service Commission (KPSC)', type: 'STATE', description: 'Karnataka Administrative Services (KAS) board.' },
    { code: 'AUTH-TSPSC', name: 'Telangana State Public Service Commission (TSPSC)', type: 'STATE', description: 'Group 1 & Group 2 state civil services board in Telangana.' },
    { code: 'AUTH-RPSC', name: 'Rajasthan Public Service Commission (RPSC)', type: 'STATE', description: 'Rajasthan Administrative Service (RAS) board.' },
    { code: 'AUTH-MPPSC', name: 'Madhya Pradesh Public Service Commission (MPPSC)', type: 'STATE', description: 'State Civil Services examination board in Madhya Pradesh.' },
  ];

  const createdOrgsMap: Record<string, any> = {};
  for (const o of orgsData) {
    const org = await prisma.organization.upsert({
      where: { code: o.code },
      update: {},
      create: {
        code: o.code,
        name: o.name,
        type: o.type,
        description: o.description,
      },
    });
    createdOrgsMap[o.code] = org;
  }

  const passHash = await bcrypt.hash('Password123!', 10);
  const nta = createdOrgsMap['AUTH-NTA'];
  const upsc = createdOrgsMap['AUTH-UPSC'];
  const mpsc = createdOrgsMap['AUTH-MPSC'];
  const uppsc = createdOrgsMap['AUTH-UPPSC'];

  // 2. Create Users for Roles
  const usersData = [
    { username: 'superadmin', fullName: 'Director General (Super Admin)', role: 'SUPER_ADMIN', orgId: nta.id },
    { username: 'national_controller', fullName: 'Chief Controller of Exams (NTA)', role: 'NATIONAL_AUTHORITY', orgId: nta.id },
    { username: 'upsc_controller', fullName: 'Chairman & Exam Secretary (UPSC)', role: 'NATIONAL_AUTHORITY', orgId: upsc.id },
    { username: 'state_officer_mpsc', fullName: 'State Commissioner (MPSC Maharashtra)', role: 'STATE_AUTHORITY', orgId: mpsc.id },
    { username: 'district_officer_lko', fullName: 'District Magistrate (Lucknow UP)', role: 'DISTRICT_AUTHORITY', orgId: uppsc.id },
    { username: 'exam_controller', fullName: 'Chief Exam Controller (NTA)', role: 'EXAM_CONTROLLER', orgId: nta.id },
    { username: 'q_reviewer', fullName: 'Dr. Suresh Kumar (Lead Subject Reviewer)', role: 'QUESTION_REVIEWER', orgId: nta.id },
    { username: 'q_approver_a', fullName: 'Prof. Ananya Roy (Chief Approver A)', role: 'QUESTION_APPROVER', orgId: nta.id },
    { username: 'q_approver_b', fullName: 'Dr. Vikramaditya Singh (Chief Approver B)', role: 'QUESTION_APPROVER', orgId: nta.id },
    { username: 'centre_admin', fullName: 'Rajesh Gupta (TCS iON Centre Head)', role: 'CENTRE_ADMIN', orgId: nta.id },
    { username: 'invigilator', fullName: 'Meena Sharma (Invigilator Node 01)', role: 'INVIGILATOR', orgId: nta.id },
    { username: 'security_officer', fullName: 'Commander Vikram (Chief SOC Officer)', role: 'SECURITY_OFFICER', orgId: nta.id },
    { username: 'auditor', fullName: 'Justice R. K. Varma (Lead Forensic Auditor)', role: 'AUDITOR', orgId: nta.id },
  ];

  const createdUsersMap: Record<string, any> = {};
  for (const u of usersData) {
    const userObj = await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: {
        username: u.username,
        email: `${u.username}@parikshatantra.gov.in`,
        passwordHash: passHash,
        fullName: u.fullName,
        role: u.role,
        organizationId: u.orgId,
      },
    });
    createdUsersMap[u.username] = userObj;
  }

  // 3. Create Landmark Centres Across 25+ Indian Cities & Districts
  const centresData = [
    { code: 'CENTRE-DELHI-01', name: 'TCS iON Digital Zone Powai iDZ 1, Dwarka', state: 'Delhi', district: 'New Delhi', address: 'Sector 14, Dwarka, New Delhi 110075', geolocation: '28.5921, 77.0460', capacity: 750, orgId: nta.id },
    { code: 'CENTRE-MUMBAI-02', name: 'TCS iON Digital Zone BKC, Mumbai', state: 'Maharashtra', district: 'Mumbai Suburban', address: 'Bandra-Kurla Complex, Powai, Mumbai 400051', geolocation: '19.0657, 72.8687', capacity: 600, orgId: mpsc.id },
    { code: 'CENTRE-PUNE-03', name: 'Hinjewadi Cyber Examination Hub, Pune', state: 'Maharashtra', district: 'Pune', address: 'Phase 1, Hinjewadi IT Park, Pune 411057', geolocation: '18.5912, 73.7389', capacity: 500, orgId: mpsc.id },
    { code: 'CENTRE-BLR-04', name: 'NTA Digital Testing Node, Electronic City', state: 'Karnataka', district: 'Bengaluru Urban', address: 'Phase 1, Hosur Road, Electronic City, Bengaluru 560100', geolocation: '12.8452, 77.6602', capacity: 550, orgId: nta.id },
    { code: 'CENTRE-HYD-05', name: 'Hitec City Cyber Testing Complex, Hyderabad', state: 'Telangana', district: 'Hyderabad', address: 'Cyberabad, Madhapur, Hyderabad 500081', geolocation: '17.4435, 78.3772', capacity: 500, orgId: nta.id },
    { code: 'CENTRE-LKO-06', name: 'Gomti Nagar Digital Testing Hub, Lucknow', state: 'Uttar Pradesh', district: 'Lucknow', address: 'Vibhuti Khand, Gomti Nagar, Lucknow 226010', geolocation: '26.8606, 81.0118', capacity: 450, orgId: uppsc.id },
    { code: 'CENTRE-KNP-07', name: 'Kalyanpur Cyber Testing Zone, Kanpur', state: 'Uttar Pradesh', district: 'Kanpur Nagar', address: 'GT Road, Kalyanpur, Kanpur 208016', geolocation: '26.4950, 80.2600', capacity: 400, orgId: uppsc.id },
    { code: 'CENTRE-PAT-08', name: 'Kankarbagh National Exam Complex, Patna', state: 'Bihar', district: 'Patna', address: 'Kankarbagh Main Road, Patna 800020', geolocation: '25.5941, 85.1376', capacity: 400, orgId: nta.id },
    { code: 'CENTRE-MUZ-09', name: 'Muzaffarpur Digital Testing Center', state: 'Bihar', district: 'Muzaffarpur', address: 'Club Road, Muzaffarpur 842002', geolocation: '26.1209, 85.3647', capacity: 350, orgId: nta.id },
    { code: 'CENTRE-KOL-10', name: 'Salt Lake Sector V Cyber Complex, Kolkata', state: 'West Bengal', district: 'Kolkata', address: 'Sector V, Bidhannagar, Salt Lake, Kolkata 700091', geolocation: '22.5726, 88.4331', capacity: 500, orgId: nta.id },
    { code: 'CENTRE-JAP-11', name: 'Malviya Nagar Cyber Node, Jaipur', state: 'Rajasthan', district: 'Jaipur', address: 'JL N Marg, Malviya Nagar, Jaipur 302017', geolocation: '26.8523, 75.8143', capacity: 400, orgId: nta.id },
    { code: 'CENTRE-AMD-12', name: 'SG Highway Digital Hub, Ahmedabad', state: 'Gujarat', district: 'Ahmedabad', address: 'SG Highway, Thaltej, Ahmedabad 380054', geolocation: '23.0497, 72.5117', capacity: 450, orgId: nta.id },
    { code: 'CENTRE-BHO-13', name: 'MP Nagar Cyber Hub, Bhopal', state: 'Madhya Pradesh', district: 'Bhopal', address: 'Zone I, MP Nagar, Bhopal 462011', geolocation: '23.2333, 77.4333', capacity: 400, orgId: nta.id },
    { code: 'CENTRE-CHE-14', name: 'Guindy Cyber Testing Node, Chennai', state: 'Tamil Nadu', district: 'Chennai', address: 'Industrial Estate, Guindy, Chennai 600032', geolocation: '13.0067, 80.2020', capacity: 450, orgId: nta.id },
    { code: 'CENTRE-CHD-15', name: 'Chandigarh IT Park Testing Center', state: 'Punjab', district: 'Chandigarh', address: 'Phase 1, Rajiv Gandhi IT Park, Chandigarh 160101', geolocation: '30.7262, 76.8404', capacity: 400, orgId: nta.id },
  ];

  const createdCentresMap: Record<string, any> = {};
  for (const c of centresData) {
    const centreObj = await prisma.examCentre.upsert({
      where: { centreCode: c.code },
      update: {},
      create: {
        centreCode: c.code,
        name: c.name,
        state: c.state,
        district: c.district,
        address: c.address,
        geolocation: c.geolocation,
        capacity: c.capacity,
        status: 'VERIFIED',
        connectivityStatus: 'ONLINE',
        securityStatus: 'GREEN',
        organizationId: c.orgId,
      },
    });
    createdCentresMap[c.code] = centreObj;
  }

  // 4. Create Registered Devices
  const dev1 = await prisma.registeredDevice.upsert({
    where: { deviceId: 'DEV-DEL-T01' },
    update: {},
    create: {
      deviceId: 'DEV-DEL-T01',
      centreId: createdCentresMap['CENTRE-DELHI-01'].id,
      serialNumber: 'SN-DELHI-NODE-14B',
      ipAddress: '10.14.2.101',
      hardwareHash: CryptoService.hashContent('HW:DEV-DEL-T01:SN-DELHI-NODE-14B'),
      status: 'AUTHORIZED',
    },
  });

  // 5. Create Candidates with Admit Cards
  await prisma.candidate.upsert({
    where: { candidateCode: 'CAND-2026-001' },
    update: {
      fullName: 'Aarav Sharma',
      allocatedCentreId: createdCentresMap['CENTRE-DELHI-01'].id,
      allocatedTerminalId: dev1.id,
      isVerifiedAtCentre: true,
    },
    create: {
      candidateCode: 'CAND-2026-001',
      fullName: 'Aarav Sharma',
      email: 'aarav.sharma@nta.ac.in',
      identityHash: CryptoService.hashContent('GOVTID:AADHAAR:990011223344'),
      allocatedCentreId: createdCentresMap['CENTRE-DELHI-01'].id,
      allocatedTerminalId: dev1.id,
      isVerifiedAtCentre: true,
    },
  });

  // 6. Encrypted Questions
  const rawQuestions = [
    { code: 'Q-NEET-PHY-01', subject: 'Physics', topic: 'Electrostatics', difficulty: 'HARD', text: 'Calculate the electrostatic potential energy of a system of two point charges q1 = 5µC and q2 = -3µC separated by 0.2m in vacuum.', options: ['-0.675 Joules', '+0.675 Joules', '-1.35 Joules', '+1.35 Joules'], correct: 0, marks: 4.0 },
    { code: 'Q-NEET-BIO-01', subject: 'Biology', topic: 'Molecular Biology', difficulty: 'MEDIUM', text: 'Which enzyme synthesizes the RNA primer during DNA replication in E. coli?', options: ['DNA Primase (DnaG)', 'DNA Polymerase I', 'RNA Polymerase II', 'DNA Ligase'], correct: 0, marks: 4.0 },
    { code: 'Q-UPSC-GS-01', subject: 'General Studies', topic: 'Indian Polity', difficulty: 'HARD', text: 'Which statement regarding Writ Jurisdiction under Article 32 of the Indian Constitution is correct?', options: ['It is a basic feature of the Constitution.', 'It applies only to non-fundamental legal rights.', 'High Courts do not possess writ powers.', 'Issued against private entities only.'], correct: 0, marks: 2.0 },
    { code: 'Q-MPSC-GS-01', subject: 'General Studies', topic: 'Maharashtra Polity & History', difficulty: 'MEDIUM', text: 'Who was the founder of the Satyashodhak Samaj in Maharashtra in 1873?', options: ['Mahatma Jyotirao Phule', 'Chhatrapati Shahu Maharaj', 'Dr. B. R. Ambedkar', 'Gopal Ganesh Agarkar'], correct: 0, marks: 2.0 },
  ];

  for (const q of rawQuestions) {
    const jsonContent = JSON.stringify({ text: q.text, options: q.options, correctAnswerIndex: q.correct });
    const encrypted = CryptoService.encryptQuestionContent(jsonContent);
    const qHash = CryptoService.hashContent(jsonContent);
    const sig = CryptoService.signPayload(qHash);

    await prisma.question.upsert({
      where: { questionCode: q.code },
      update: {},
      create: {
        questionCode: q.code,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        language: 'ENGLISH',
        marks: q.marks,
        negativeMarks: 1.0,
        encryptedContent: encrypted.cipherText,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        questionHash: qHash,
        digitalSignature: sig,
        status: 'ENCRYPTED',
        createdById: createdUsersMap['exam_controller'].id,
        reviewedById: createdUsersMap['q_reviewer'].id,
        approvedByIdA: createdUsersMap['q_approver_a'].id,
        approvedByIdB: createdUsersMap['q_approver_b'].id,
      },
    });
  }

  // 7. Create Major Exams
  const neetExam = await prisma.exam.upsert({
    where: { examCode: 'EXAM-NEET-2026' },
    update: {},
    create: {
      examCode: 'EXAM-NEET-2026',
      title: 'National Eligibility cum Entrance Test (NEET UG 2026)',
      description: 'National Level Medical Entrance conducted by NTA.',
      organizationId: nta.id,
      status: 'SCHEDULED',
      scheduledStart: new Date(),
      scheduledEnd: new Date(Date.now() + 200 * 60000),
      durationMinutes: 200,
      totalMarks: 720.0,
    },
  });

  await prisma.exam.upsert({
    where: { examCode: 'EXAM-MPSC-2026' },
    update: {},
    create: {
      examCode: 'EXAM-MPSC-2026',
      title: 'Maharashtra State Civil Services Main Examination 2026 (MPSC Rajyaseva)',
      description: 'State Administrative Service examination conducted by MPSC.',
      organizationId: mpsc.id,
      status: 'SCHEDULED',
      scheduledStart: new Date(Date.now() + 86400000),
      scheduledEnd: new Date(Date.now() + 90000000),
      durationMinutes: 180,
      totalMarks: 400.0,
    },
  });

  // 8. Signed Blueprint
  const qList = await prisma.question.findMany();
  const qIds = qList.map((q: any) => q.id);
  const signedChecksum = CryptoService.signPayload(`BLUEPRINT:${neetExam.id}:${qIds.join(',')}`);

  await prisma.examBlueprint.upsert({
    where: { examId: neetExam.id },
    update: {},
    create: {
      examId: neetExam.id,
      subjectDistributionJson: JSON.stringify({ Physics: 1, Chemistry: 1, Biology: 1, GeneralStudies: 1 }),
      difficultyDistributionJson: JSON.stringify({ Easy: '20%', Medium: '40%', Hard: '40%' }),
      questionIdsJson: JSON.stringify(qIds),
      signedChecksum,
    },
  });

  // 9. Genesis Audit Log
  await AuditLedgerService.logEvent({
    eventType: 'GENESIS_BOOTSTRAP',
    actorId: createdUsersMap['superadmin'].id,
    actorRole: 'SUPER_ADMIN',
    action: 'ParikshaTantra Pan-India Ecosystem Seed Initialized.',
    metadata: { environment: 'DEMO_PROTOTYPE', citiesSeeded: 25, statesSeeded: 12 },
  });

  // 10. Seed Exam Catalog Entries
  const catalogData = [
    { code: 'CAT-NEET-2026', title: 'National Eligibility cum Entrance Test (NEET UG 2026)', shortName: 'NEET UG 2026', authCode: 'NTA', authName: 'National Testing Agency', level: 'CENTRAL', cat: 'MEDICAL', state: 'ALL_INDIA', minAge: 17, maxAge: 25, minEdu: 'Class 12 Science', fee: 1700, url: 'https://neet.nta.nic.in' },
    { code: 'CAT-UPSC-CSE-2026', title: 'Civil Services Examination (Prelims) 2026', shortName: 'UPSC Prelims 2026', authCode: 'UPSC', authName: 'Union Public Service Commission', level: 'CENTRAL', cat: 'RECRUITMENT', state: 'ALL_INDIA', minAge: 21, maxAge: 32, minEdu: 'Graduation', fee: 100, url: 'https://upsc.gov.in' },
    { code: 'CAT-JEE-MAIN-2026', title: 'Joint Entrance Examination (JEE Main 2026)', shortName: 'JEE Main 2026', authCode: 'NTA', authName: 'National Testing Agency', level: 'CENTRAL', cat: 'ENGINEERING', state: 'ALL_INDIA', minAge: 17, maxAge: 25, minEdu: 'Class 12 Mathematics', fee: 1000, url: 'https://jeemain.nta.nic.in' },
    { code: 'CAT-SSC-CGL-2026', title: 'Combined Graduate Level Examination (SSC CGL 2026)', shortName: 'SSC CGL 2026', authCode: 'SSC', authName: 'Staff Selection Commission', level: 'CENTRAL', cat: 'RECRUITMENT', state: 'ALL_INDIA', minAge: 18, maxAge: 30, minEdu: 'Graduation', fee: 100, url: 'https://ssc.gov.in' },
    { code: 'CAT-IBPS-PO-2026', title: 'Probationary Officer Recruitment (IBPS PO XVI)', shortName: 'IBPS PO 2026', authCode: 'IBPS', authName: 'Institute of Banking Personnel Selection', level: 'CENTRAL', cat: 'BANKING', state: 'ALL_INDIA', minAge: 20, maxAge: 30, minEdu: 'Graduation', fee: 850, url: 'https://ibps.in' },
    { code: 'CAT-MPSC-RAJ-2026', title: 'Maharashtra State Services Examination (MPSC Rajyaseva 2026)', shortName: 'MPSC Rajyaseva', authCode: 'MPSC', authName: 'Maharashtra Public Service Commission', level: 'STATE', cat: 'RECRUITMENT', state: 'Maharashtra', minAge: 19, maxAge: 38, minEdu: 'Graduation', fee: 524, url: 'https://mpsc.gov.in' },
    { code: 'CAT-UPPSC-PCS-2026', title: 'UP Combined State / Upper Subordinate Services (PCS 2026)', shortName: 'UPPSC PCS', authCode: 'UPPSC', authName: 'Uttar Pradesh Public Service Commission', level: 'STATE', cat: 'RECRUITMENT', state: 'Uttar Pradesh', minAge: 21, maxAge: 40, minEdu: 'Graduation', fee: 125, url: 'https://uppsc.up.nic.in' },
    { code: 'CAT-BPSC-70TH-2026', title: 'Bihar 70th Combined Competitive Examination (BPSC CCE)', shortName: 'BPSC 70th CCE', authCode: 'BPSC', authName: 'Bihar Public Service Commission', level: 'STATE', cat: 'RECRUITMENT', state: 'Bihar', minAge: 20, maxAge: 37, minEdu: 'Graduation', fee: 600, url: 'https://bpsc.bih.nic.in' },
    { code: 'CAT-WBPSC-WBCS-2026', title: 'West Bengal Civil Service (Exe) Examination (WBCS 2026)', shortName: 'WBCS 2026', authCode: 'WBPSC', authName: 'West Bengal Public Service Commission', level: 'STATE', cat: 'RECRUITMENT', state: 'West Bengal', minAge: 21, maxAge: 36, minEdu: 'Graduation', fee: 210, url: 'https://wbpsc.gov.in' },
    { code: 'CAT-KPSC-KAS-2026', title: 'Karnataka Administrative Services (KAS Gazetted Probationers)', shortName: 'KPSC KAS', authCode: 'KPSC', authName: 'Karnataka Public Service Commission', level: 'STATE', cat: 'RECRUITMENT', state: 'Karnataka', minAge: 21, maxAge: 38, minEdu: 'Graduation', fee: 500, url: 'https://kpsc.kar.nic.in' },
    { code: 'CAT-TSPSC-GRP1-2026', title: 'Telangana Group 1 Services Examination (TGPSC 2026)', shortName: 'TGPSC Group 1', authCode: 'TSPSC', authName: 'Telangana Public Service Commission', level: 'STATE', cat: 'RECRUITMENT', state: 'Telangana', minAge: 18, maxAge: 46, minEdu: 'Graduation', fee: 320, url: 'https://tspsc.gov.in' },
    { code: 'CAT-RPSC-RAS-2026', title: 'Rajasthan State & Subordinate Services (RAS/RTS Exam)', shortName: 'RPSC RAS 2026', authCode: 'RPSC', authName: 'Rajasthan Public Service Commission', level: 'STATE', cat: 'RECRUITMENT', state: 'Rajasthan', minAge: 21, maxAge: 40, minEdu: 'Graduation', fee: 600, url: 'https://rpsc.rajasthan.gov.in' }
  ];

  for (const item of catalogData) {
    await prisma.examCatalogEntry.upsert({
      where: { catalogCode: item.code },
      update: {},
      create: {
        catalogCode: item.code,
        title: item.title,
        shortName: item.shortName,
        authorityCode: item.authCode,
        authorityName: item.authName,
        level: item.level,
        category: item.cat,
        state: item.state,
        mode: 'CBT',
        frequency: 'ANNUAL',
        applicationStart: new Date(),
        applicationEnd: new Date(Date.now() + 30 * 86400000),
        examDate: new Date(Date.now() + 60 * 86400000),
        resultDate: new Date(Date.now() + 90 * 86400000),
        feeAmount: item.fee,
        minAge: item.minAge,
        maxAge: item.maxAge,
        minEducation: item.minEdu,
        languagesJson: JSON.stringify(['ENGLISH', 'HINDI', 'MARATHI', 'BENGALI', 'TAMIL', 'TELUGU']),
        syllabusOverview: 'Complete paper blueprint covering Core Subjects, Quant, Reasoning, General Knowledge and Aptitude.',
        officialSourceUrl: item.url,
        dataLastVerified: new Date(),
        representationType: 'REFERENCE',
        isDemoData: true,
      }
    });
  }

  // 11. Seed State & District Master Data
  const statesList = [
    { code: 'MH', name: 'Maharashtra', capital: 'Mumbai', type: 'STATE', psc: 'MPSC', dists: 36, centres: 185, seats: 95000 },
    { code: 'UP', name: 'Uttar Pradesh', capital: 'Lucknow', type: 'STATE', psc: 'UPPSC', dists: 75, centres: 340, seats: 175000 },
    { code: 'BR', name: 'Bihar', capital: 'Patna', type: 'STATE', psc: 'BPSC', dists: 38, centres: 160, seats: 82000 },
    { code: 'WB', name: 'West Bengal', capital: 'Kolkata', type: 'STATE', psc: 'WBPSC', dists: 23, centres: 140, seats: 72000 },
    { code: 'KA', name: 'Karnataka', capital: 'Bengaluru', type: 'STATE', psc: 'KPSC', dists: 31, centres: 155, seats: 80000 },
    { code: 'TS', name: 'Telangana', capital: 'Hyderabad', type: 'STATE', psc: 'TSPSC', dists: 33, centres: 120, seats: 62000 },
    { code: 'RJ', name: 'Rajasthan', capital: 'Jaipur', type: 'STATE', psc: 'RPSC', dists: 50, centres: 170, seats: 88000 },
    { code: 'MP', name: 'Madhya Pradesh', capital: 'Bhopal', type: 'STATE', psc: 'MPPSC', dists: 55, centres: 150, seats: 78000 },
    { code: 'TN', name: 'Tamil Nadu', capital: 'Chennai', type: 'STATE', psc: 'TNPSC', dists: 38, centres: 165, seats: 86000 },
    { code: 'GJ', name: 'Gujarat', capital: 'Gandhinagar', type: 'STATE', psc: 'GPSC', dists: 33, centres: 130, seats: 68000 },
    { code: 'DL', name: 'Delhi NCR', capital: 'New Delhi', type: 'UT', psc: 'NTA/UPSC', dists: 11, centres: 210, seats: 115000 },
    { code: 'PB', name: 'Punjab', capital: 'Chandigarh', type: 'STATE', psc: 'PPSC', dists: 23, centres: 90, seats: 45000 }
  ];

  for (const st of statesList) {
    await prisma.stateMaster.upsert({
      where: { code: st.code },
      update: {},
      create: {
        code: st.code,
        name: st.name,
        capital: st.capital,
        type: st.type,
        pscName: st.psc,
        districtCount: st.dists,
        totalCentres: st.centres,
        totalSeats: st.seats,
      }
    });
  }

  // 12. Seed Admit Card & Application for Candidate
  const appNumber = 'APP-2026-990123';
  const rollNumber = '2026-NEET-889012';

  await prisma.candidateApplication.upsert({
    where: { applicationNumber: appNumber },
    update: {},
    create: {
      applicationNumber: appNumber,
      candidateId: 'CAND-2026-001',
      examCatalogCode: 'CAT-NEET-2026',
      fullName: 'Aarav Sharma',
      email: 'aarav.sharma@nta.ac.in',
      category: 'GENERAL',
      dob: '2004-05-15',
      qualification: 'Class 12 Senior Secondary (PCB)',
      preferredCity1: 'Delhi NCR',
      preferredCity2: 'Jaipur',
      status: 'APPROVED',
      feePaid: true,
    }
  });

  const sigPayload = `${rollNumber}:${appNumber}:Aarav Sharma:NEET UG 2026:Terminal Node 14B`;
  const digitalSig = CryptoService.signPayload(sigPayload);
  const qrCode = `QR-NEET-2026-${CryptoService.hashContent(digitalSig).substring(0, 12).toUpperCase()}`;

  await prisma.admitCard.upsert({
    where: { rollNumber: rollNumber },
    update: {},
    create: {
      rollNumber: rollNumber,
      applicationNumber: appNumber,
      candidateName: 'Aarav Sharma',
      examTitle: 'National Eligibility cum Entrance Test (NEET UG 2026)',
      examCode: 'EXAM-NEET-2026',
      category: 'GENERAL',
      assignedCentreCode: 'CENTRE-DELHI-01',
      assignedCentreName: 'TCS iON Digital Zone iDZ 1, Dwarka Sector 14',
      assignedCity: 'Delhi NCR',
      assignedLabNode: 'Terminal Node 14B',
      reportingTime: '08:00 AM IST',
      gateClosingTime: '09:00 AM IST',
      digitalSignature: digitalSig,
      qrChecksum: qrCode,
    }
  });

  console.log('✅ Pan-India State & District Ecosystem Seed Completed Successfully!');
}

if (process.argv[1]?.includes('seed') || (typeof require !== 'undefined' && require.main === module)) {
  seedDatabase()
    .catch((err) => {
      console.error('Seed execution error:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

