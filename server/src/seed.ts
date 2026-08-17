import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { CryptoService } from './services/cryptoService';
import { AuditLedgerService } from './services/auditLedgerService';

const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log('🌱 Starting ParikshaTantra Real Indian Examination Ecosystem Seed...');

  // 1. Create Real Indian Examination Authorities & Boards
  const nta = await prisma.organization.upsert({
    where: { code: 'AUTH-NTA' },
    update: {},
    create: {
      code: 'AUTH-NTA',
      name: 'National Testing Agency (NTA)',
      type: 'CENTRAL',
      description: 'Autonomous premier national testing organization conducting NEET (UG), JEE (Main), UGC NET.',
    },
  });

  const upsc = await prisma.organization.upsert({
    where: { code: 'AUTH-UPSC' },
    update: {},
    create: {
      code: 'AUTH-UPSC',
      name: 'Union Public Service Commission (UPSC)',
      type: 'CENTRAL',
      description: 'India premier central recruiting agency conducting Civil Services Examination (CSE).',
    },
  });

  const ssc = await prisma.organization.upsert({
    where: { code: 'AUTH-SSC' },
    update: {},
    create: {
      code: 'AUTH-SSC',
      name: 'Staff Selection Commission (SSC)',
      type: 'CENTRAL',
      description: 'Central recruitment board conducting CGL, CHSL, and Multi-Tasking Staff examinations.',
    },
  });

  const mpsc = await prisma.organization.upsert({
    where: { code: 'AUTH-MPSC' },
    update: {},
    create: {
      code: 'AUTH-MPSC',
      name: 'Maharashtra Public Service Commission (MPSC)',
      type: 'STATE',
      description: 'State public service recruiting board for civil and technical services in Maharashtra.',
    },
  });

  const uppsc = await prisma.organization.upsert({
    where: { code: 'AUTH-UPPSC' },
    update: {},
    create: {
      code: 'AUTH-UPPSC',
      name: 'Uttar Pradesh Public Service Commission (UPPSC)',
      type: 'STATE',
      description: 'State public service recruiting authority for Uttar Pradesh state services.',
    },
  });

  const passHash = await bcrypt.hash('Password123!', 10);

  // 2. Create Users for 12 Roles
  const usersData = [
    { username: 'superadmin', fullName: 'Director General (Super Admin)', role: 'SUPER_ADMIN', orgId: nta.id },
    { username: 'national_controller', fullName: 'Chief Controller of Exams (NTA)', role: 'NATIONAL_AUTHORITY', orgId: nta.id },
    { username: 'upsc_controller', fullName: 'Chairman & Exam Secretary (UPSC)', role: 'NATIONAL_AUTHORITY', orgId: upsc.id },
    { username: 'state_officer', fullName: 'State Examination Commissioner (MPSC)', role: 'STATE_AUTHORITY', orgId: mpsc.id },
    { username: 'district_officer', fullName: 'District Magistrate / Chief Admin', role: 'DISTRICT_AUTHORITY', orgId: uppsc.id },
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

  // 3. Create Landmark Exam Centres across 10 Major Indian Cities
  const centresData = [
    {
      code: 'CENTRE-DELHI-01',
      name: 'TCS iON Digital Zone Powai iDZ 1, Dwarka',
      state: 'Delhi',
      district: 'New Delhi',
      address: 'Sector 14, Dwarka, New Delhi 110075',
      geolocation: '28.5921, 77.0460',
      capacity: 750,
      orgId: nta.id,
    },
    {
      code: 'CENTRE-MUMBAI-02',
      name: 'TCS iON Digital Zone BKC, Mumbai',
      state: 'Maharashtra',
      district: 'Mumbai Suburban',
      address: 'Bandra-Kurla Complex, Powai, Mumbai 400051',
      geolocation: '19.0657, 72.8687',
      capacity: 600,
      orgId: mpsc.id,
    },
    {
      code: 'CENTRE-BLR-03',
      name: 'NTA Digital Testing Node, Electronic City',
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      address: 'Phase 1, Hosur Road, Electronic City, Bengaluru 560100',
      geolocation: '12.8452, 77.6602',
      capacity: 550,
      orgId: nta.id,
    },
    {
      code: 'CENTRE-HYD-04',
      name: 'Hitec City Cyber Testing Complex, Hyderabad',
      state: 'Telangana',
      district: 'Hyderabad',
      address: 'Cyberabad, Madhapur, Hyderabad 500081',
      geolocation: '17.4435, 78.3772',
      capacity: 500,
      orgId: nta.id,
    },
    {
      code: 'CENTRE-LKO-05',
      name: 'Gomti Nagar Digital Testing Hub, Lucknow',
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      address: 'Vibhuti Khand, Gomti Nagar, Lucknow 226010',
      geolocation: '26.8606, 81.0118',
      capacity: 450,
      orgId: uppsc.id,
    },
    {
      code: 'CENTRE-PAT-06',
      name: 'Kankarbagh National Exam Complex, Patna',
      state: 'Bihar',
      district: 'Patna',
      address: 'Kankarbagh Main Road, Patna 800020',
      geolocation: '25.5941, 85.1376',
      capacity: 400,
      orgId: nta.id,
    },
    {
      code: 'CENTRE-JAP-07',
      name: 'Malviya Nagar Cyber Node, Jaipur',
      state: 'Rajasthan',
      district: 'Jaipur',
      address: 'JL N Marg, Malviya Nagar, Jaipur 302017',
      geolocation: '26.8523, 75.8143',
      capacity: 400,
      orgId: nta.id,
    },
    {
      code: 'CENTRE-KOL-08',
      name: 'Salt Lake Sector V Cyber Complex, Kolkata',
      state: 'West Bengal',
      district: 'Kolkata',
      address: 'Sector V, Bidhannagar, Salt Lake, Kolkata 700091',
      geolocation: '22.5726, 88.4331',
      capacity: 500,
      orgId: nta.id,
    },
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

  // 4. Create Registered Devices for Main Centres
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

  await prisma.registeredDevice.upsert({
    where: { deviceId: 'DEV-DEL-T02' },
    update: {},
    create: {
      deviceId: 'DEV-DEL-T02',
      centreId: createdCentresMap['CENTRE-DELHI-01'].id,
      serialNumber: 'SN-DELHI-NODE-14C',
      ipAddress: '10.14.2.102',
      hardwareHash: CryptoService.hashContent('HW:DEV-DEL-T02:SN-DELHI-NODE-14C'),
      status: 'AUTHORIZED',
    },
  });

  // 5. Create Candidates with Admit Card Roll Numbers & Seat Nodes
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

  await prisma.candidate.upsert({
    where: { candidateCode: 'CAND-2026-002' },
    update: {},
    create: {
      candidateCode: 'CAND-2026-002',
      fullName: 'Priya Patel',
      email: 'priya.patel@upsc.gov.in',
      identityHash: CryptoService.hashContent('GOVTID:PAN:ABCDE1234F'),
      allocatedCentreId: createdCentresMap['CENTRE-MUMBAI-02'].id,
      allocatedTerminalId: dev1.id,
      isVerifiedAtCentre: true,
    },
  });

  // 6. Create Encrypted Questions in Vault (Physics, Chemistry, Biology, Maths, GS)
  const rawQuestions = [
    {
      code: 'Q-NEET-PHY-01',
      subject: 'Physics',
      topic: 'Electrostatics & Potential',
      difficulty: 'HARD',
      text: 'Calculate the electrostatic potential energy of a system of two point charges q1 = 5µC and q2 = -3µC separated by a distance of 0.2m in vacuum.',
      options: ['-0.675 Joules', '+0.675 Joules', '-1.35 Joules', '+1.35 Joules'],
      correct: 0,
      marks: 4.0,
    },
    {
      code: 'Q-NEET-BIO-01',
      subject: 'Biology',
      topic: 'Molecular Basis of Inheritance',
      difficulty: 'MEDIUM',
      text: 'Which enzyme is responsible for synthesizing the RNA primer during DNA replication in Escherichia coli?',
      options: ['DNA Primase (DnaG)', 'DNA Polymerase I', 'RNA Polymerase II', 'DNA Ligase'],
      correct: 0,
      marks: 4.0,
    },
    {
      code: 'Q-NEET-CHEM-01',
      subject: 'Chemistry',
      topic: 'Chemical Equilibrium',
      difficulty: 'MEDIUM',
      text: 'For the reversible reaction N2(g) + 3H2(g) ⇌ 2NH3(g), what is the relation between Kp and Kc at temperature T?',
      options: ['Kp = Kc(RT)^(-2)', 'Kp = Kc(RT)^(2)', 'Kp = Kc(RT)^(-1)', 'Kp = Kc(RT)'],
      correct: 0,
      marks: 4.0,
    },
    {
      code: 'Q-UPSC-GS-01',
      subject: 'General Studies',
      topic: 'Indian Polity & Governance',
      difficulty: 'HARD',
      text: 'Which statement regarding the Writ Jurisdiction of the Supreme Court of India under Article 32 is correct?',
      options: [
        'It is a basic feature of the Constitution and cannot be curtailed by constitutional amendment.',
        'It can be invoked only for non-fundamental legal rights.',
        'High Courts do not possess writ powers under Article 226.',
        'Writs can be issued against private individuals only.'
      ],
      correct: 0,
      marks: 2.0,
    },
    {
      code: 'Q-JEE-MATH-01',
      subject: 'Mathematics',
      topic: 'Differential Calculus',
      difficulty: 'HARD',
      text: 'Evaluate the limit L = lim (x->0) [ (sin x - x + x^3 / 6) / x^5 ].',
      options: ['1/120', '1/60', '1/24', '0'],
      correct: 0,
      marks: 4.0,
    },
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

  // 7. Create Major Real Examinations
  const neetExam = await prisma.exam.upsert({
    where: { examCode: 'EXAM-NEET-2026' },
    update: {},
    create: {
      examCode: 'EXAM-NEET-2026',
      title: 'National Eligibility cum Entrance Test (NEET UG 2026)',
      description: 'National Level Medical & Dental Undergraduate Entrance Examination conducted by NTA.',
      organizationId: nta.id,
      status: 'SCHEDULED',
      scheduledStart: new Date(),
      scheduledEnd: new Date(Date.now() + 200 * 60000),
      durationMinutes: 200,
      totalMarks: 720.0,
    },
  });

  await prisma.exam.upsert({
    where: { examCode: 'EXAM-UPSC-2026' },
    update: {},
    create: {
      examCode: 'EXAM-UPSC-2026',
      title: 'Civil Services Preliminary Examination 2026 (UPSC CSE)',
      description: 'Tier-1 National Administrative & Civil Services Preliminary Examination.',
      organizationId: upsc.id,
      status: 'SCHEDULED',
      scheduledStart: new Date(Date.now() + 86400000),
      scheduledEnd: new Date(Date.now() + 90000000),
      durationMinutes: 120,
      totalMarks: 200.0,
    },
  });

  // 8. Create Signed Exam Blueprint for NEET
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
    action: 'ParikshaTantra Real Indian Examination Ecosystem Seed Initialized.',
    metadata: { environment: 'DEMO_PROTOTYPE', authorities: ['NTA', 'UPSC', 'SSC', 'MPSC', 'UPPSC'] },
  });

  console.log('✅ Real Indian Examination Ecosystem Database Seed Completed Successfully!');
}
