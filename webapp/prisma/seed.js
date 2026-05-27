// prisma/seed.js — Smart Parking USPG, Grupo 5
// Ejecutar: npm run seed

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // ─── Campus ─────────────────────────────────────────────────────────────
  let campus = await prisma.campus.findFirst();
  if (!campus) {
    campus = await prisma.campus.create({
      data: {
        name: 'Universidad San Pablo Guatemala',
        address: '13 Calle 4-65, Guatemala City, Guatemala',
        lat: 14.5847, lng: -90.5085, zoom: 18, total_spaces: 500,
      },
    });
    console.log(`✅ Campus creado: ${campus.name}`);
  } else {
    console.log(`✅ Campus ya existe: ${campus.name}`);
  }

  // ─── Usuarios ─────────────────────────────────────────────────────────
  const [hashAdmin, hashTeacher, hashStudent, hashSecurity] = await Promise.all([
    bcrypt.hash('Admin2026!', 10),
    bcrypt.hash('Teacher2026!', 10),
    bcrypt.hash('Student2026!', 10),
    bcrypt.hash('Security2026!', 10),
  ]);

  const usersSpec = [
    { email: 'admin@uspg.edu.gt',     password_hash: hashAdmin,    role: 'ADMIN',    first_name: 'José',   last_name: 'Galicia', carnet: null,       nfc_card_id: 'NFC-ADMIN-SEED',    qr_code: 'QR-ADMIN-SEED' },
    { email: 'docente01@uspg.edu.gt', password_hash: hashTeacher,  role: 'TEACHER',  first_name: 'María',  last_name: 'López',   carnet: null,       nfc_card_id: 'NFC-TEACHER-SEED',  qr_code: 'QR-TEACHER-SEED' },
    { email: 'est001@uspg.edu.gt',    password_hash: hashStudent,  role: 'STUDENT',  first_name: 'Carlos', last_name: 'Pérez',   carnet: '2021-0001',nfc_card_id: 'NFC-STUDENT-SEED1', qr_code: 'QR-STUDENT-SEED1' },
    { email: 'est002@uspg.edu.gt',    password_hash: hashStudent,  role: 'STUDENT',  first_name: 'Ana',    last_name: 'García',  carnet: '2021-0002',nfc_card_id: 'NFC-STUDENT-SEED2', qr_code: 'QR-STUDENT-SEED2' },
    { email: 'guardia01@uspg.edu.gt', password_hash: hashSecurity, role: 'SECURITY', first_name: 'Pedro',  last_name: 'Morales', carnet: null,       nfc_card_id: 'NFC-SECURITY-SEED', qr_code: 'QR-SECURITY-SEED' },
  ];

  const userMap = {};
  for (const spec of usersSpec) {
    let u = await prisma.user.findFirst({ where: { email: spec.email } });
    if (!u) {
      u = await prisma.user.create({ data: spec });
      console.log(`  ✅ Usuario creado: ${spec.email}`);
    } else {
      console.log(`  ℹ️  Usuario ya existe: ${spec.email} (id: ${u.id})`);
    }
    userMap[spec.email] = u.id;
  }

  const adminId    = userMap['admin@uspg.edu.gt'];
  const teacherId  = userMap['docente01@uspg.edu.gt'];
  const student1Id = userMap['est001@uspg.edu.gt'];
  const student2Id = userMap['est002@uspg.edu.gt'];
  const securityId = userMap['guardia01@uspg.edu.gt'];

  // ─── Vehículos ─────────────────────────────────────────────────────────
  const vehiclesSpec = [
    { user_id: adminId,    placa: 'P123ABC', brand: 'Toyota',     model: 'Fortuner', color: 'Blanco',   year: 2022 },
    { user_id: teacherId,  placa: 'C456XYZ', brand: 'Honda',      model: 'CR-V',     color: 'Gris',     year: 2020 },
    { user_id: student1Id, placa: 'P789DEF', brand: 'Hyundai',    model: 'Tucson',   color: 'Negro',    year: 2019 },
    { user_id: student1Id, placa: 'M001GHI', brand: 'Suzuki',     model: 'Swift',    color: 'Rojo',     year: 2021 },
    { user_id: student2Id, placa: 'C234JKL', brand: 'Kia',        model: 'Sportage', color: 'Azul',     year: 2023 },
    { user_id: student2Id, placa: 'O567MNO', brand: 'Nissan',     model: 'Versa',    color: 'Blanco',   year: 2020 },
    { user_id: securityId, placa: 'P890PQR', brand: 'Toyota',     model: 'Hilux',    color: 'Plateado', year: 2018 },
    { user_id: teacherId,  placa: 'M345STU', brand: 'Volkswagen', model: 'Jetta',    color: 'Gris',     year: 2021 },
    { user_id: student1Id, placa: 'C678VWX', brand: 'Chevrolet',  model: 'Captiva',  color: 'Café',     year: 2017 },
    { user_id: adminId,    placa: 'P901YZA', brand: 'Land Rover', model: 'Defender', color: 'Verde',    year: 2024 },
  ];

  const vehicleMap = {};
  for (const spec of vehiclesSpec) {
    let v = await prisma.vehicle.findFirst({ where: { placa: spec.placa } });
    if (!v) {
      v = await prisma.vehicle.create({ data: spec });
    }
    vehicleMap[spec.placa] = v.id;
  }
  console.log(`✅ Vehículos: ${vehiclesSpec.length}`);

  // ─── Espacios ─────────────────────────────────────────────────────────
  const existingSpaces = await prisma.parkingSpace.count();
  if (existingSpaces < 500) {
    const zoneDefs = [
      { zone: 'A', count: 220, handicapped: 5, electric: 10 },
      { zone: 'B', count: 150, handicapped: 3, electric:  6 },
      { zone: 'C', count: 100, handicapped: 2, electric:  0 },
      { zone: 'D', count:  30, handicapped: 0, electric:  0 },
    ];
    let created = 0;
    for (const def of zoneDefs) {
      for (let n = 1; n <= def.count; n++) {
        const code = `${def.zone}-${String(n).padStart(3, '0')}`;
        let type = 'STANDARD';
        if (def.zone === 'D')         type = n <= 15 ? 'TEACHER' : n <= 25 ? 'VIP' : 'RESERVED';
        else if (n <= def.handicapped) type = 'HANDICAPPED';
        else if (n <= def.handicapped + def.electric) type = 'ELECTRIC';

        const existing = await prisma.parkingSpace.findFirst({ where: { code } });
        if (!existing) {
          await prisma.parkingSpace.create({ data: { code, campus_id: campus.id, zone: def.zone, type, status: 'AVAILABLE' } });
          created++;
        }
      }
    }
    console.log(`✅ Espacios: ${created} nuevos creados`);
  } else {
    console.log(`✅ Espacios: ya existen (${existingSpaces})`);
  }

  // ─── Obtener IDs de espacios para sesiones ─────────────────────────────
  const getSpaceId = async (code) => {
    const s = await prisma.parkingSpace.findFirst({ where: { code } });
    return s?.id;
  };

  // ─── Suscripciones ─────────────────────────────────────────────────────
  const now = new Date();
  const existingSub1 = await prisma.parkingSubscription.findFirst({ where: { user_id: student1Id, status: 'ACTIVE' } });
  if (!existingSub1) {
    await prisma.parkingSubscription.create({
      data: {
        user_id: student1Id, type: 'MONTHLY', status: 'ACTIVE',
        start_date: new Date(now.getTime() - 15 * 86400000),
        end_date: new Date(now.getTime() + 15 * 86400000),
        amount_paid: 150.00, payment_reference: 'REF-2026-0501',
      },
    });
  }

  const existingSub2 = await prisma.parkingSubscription.findFirst({ where: { user_id: student2Id, status: 'ACTIVE' } });
  if (!existingSub2) {
    await prisma.parkingSubscription.create({
      data: {
        user_id: student2Id, type: 'SEMESTER', status: 'ACTIVE',
        start_date: new Date(now.getTime() - 30 * 86400000),
        end_date: new Date(now.getTime() + 150 * 86400000),
        amount_paid: 600.00, payment_reference: 'REF-2026-0502',
      },
    });
  }
  console.log('✅ Suscripciones: creadas');

  // ─── Eventos ─────────────────────────────────────────────────────────
  const existingEvent = await prisma.parkingEvent.findFirst({ where: { name: 'Graduación Junio 2026' } });
  if (!existingEvent) {
    await prisma.parkingEvent.create({
      data: {
        name: 'Graduación Junio 2026', description: 'Graduación semestre 2 — Grupo 5',
        event_date: new Date('2026-06-15'),
        start_time: new Date('2026-06-15T12:00:00Z'),
        end_time: new Date('2026-06-16T04:00:00Z'),
        tariff_mode: 'FLAT_RATE', flat_rate: 25.00, affected_zones: 'A,B,C,D',
        status: 'SCHEDULED', created_by_user_id: adminId,
        uses_external_parking: true, external_parking_name: 'Terreno Auxiliar Norte', shuttle_available: true,
      },
    });
  }
  console.log('✅ Eventos: creados');

  // ─── Sesiones activas ─────────────────────────────────────────────────
  const spaceCodes = ['A-001','A-002','D-001','B-001','C-001'];
  const sessionUsers = [student1Id, student2Id, teacherId, securityId, adminId];
  const sessionVehicles = ['P789DEF','C234JKL','C456XYZ','P890PQR','P123ABC'];
  const sessionMethods = ['QR','NFC','NFC','MANUAL','NFC'];
  const sessionHours = [2, 1, 3, 0.5, 4];

  let activeCreated = 0;
  for (let i = 0; i < 5; i++) {
    const spaceId = await getSpaceId(spaceCodes[i]);
    const vehicleId = vehicleMap[sessionVehicles[i]];
    if (!spaceId || !vehicleId) continue;

    const existing = await prisma.parkingSession.findFirst({ where: { space_id: spaceId, status: 'ACTIVE' } });
    if (!existing) {
      await prisma.parkingSession.create({
        data: {
          vehicle_id: vehicleId, space_id: spaceId, user_id: sessionUsers[i],
          entry_method: sessionMethods[i],
          entry_time: new Date(now.getTime() - sessionHours[i] * 3600000),
          status: 'ACTIVE',
        },
      });
      await prisma.parkingSpace.update({ where: { id: spaceId }, data: { status: 'OCCUPIED' } });
      activeCreated++;
    }
  }
  console.log(`✅ Sesiones activas: ${activeCreated} creadas`);

  // ─── Historial 30 días ─────────────────────────────────────────────────
  const histCount = await prisma.parkingSession.count({ where: { status: 'COMPLETED' } });
  if (histCount < 100) {
    const histVehicles = [vehicleMap['P789DEF'], vehicleMap['C234JKL'], vehicleMap['M001GHI']].filter(Boolean);
    const histUsers    = [student1Id, student2Id, student1Id];
    const histSpaces   = await Promise.all(['A-010','B-010','A-020','C-010'].map(getSpaceId));
    const validSpaces  = histSpaces.filter(Boolean);
    let created = 0;

    for (let h = 1; h <= 720 && created < 720; h++) {
      if (histVehicles.length === 0 || validSpaces.length === 0) break;
      const vid = histVehicles[h % histVehicles.length];
      const uid = histUsers[h % histUsers.length];
      const sid = validSpaces[h % validSpaces.length];
      const dur = 60 + (h % 180);
      const entryTime = new Date(now.getTime() - h * 3600000);
      const exitTime  = new Date(entryTime.getTime() + dur * 60000);
      const amount    = parseFloat(((dur / 60) * 5).toFixed(2));

      await prisma.parkingSession.create({
        data: {
          vehicle_id: vid, space_id: sid, user_id: uid,
          entry_time: entryTime, exit_time: exitTime,
          entry_method: 'QR', status: 'COMPLETED',
          duration_minutes: dur, amount_due: amount, is_paid: true,
        },
      });
      created++;
    }
    console.log(`✅ Historial: ${created} sesiones creadas`);
  } else {
    console.log(`✅ Historial: ya existe (${histCount} sesiones completadas)`);
  }

  console.log('\n🎉 Seed completado!');
  console.log('Credenciales de prueba:');
  console.log('  admin@uspg.edu.gt     / Admin2026!');
  console.log('  docente01@uspg.edu.gt / Teacher2026!');
  console.log('  est001@uspg.edu.gt    / Student2026!  (carnet: 2021-0001)');
  console.log('  est002@uspg.edu.gt    / Student2026!  (carnet: 2021-0002)');
  console.log('  guardia01@uspg.edu.gt / Security2026!');
}

main()
  .catch(e => { console.error('❌ Error en seed:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
