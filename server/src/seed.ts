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

  console.log('✅ Pan-India State & District Ecosystem Seed Completed Successfully!');
}
