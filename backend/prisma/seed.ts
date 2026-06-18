import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/services/helpers.js';
import { config } from '../src/config/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await hashPassword('Admin@123');

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@afosha.org',
      phone: '+251900000000',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      isVerified: true,
      preferredLanguage: 'om',
      mustChangePassword: true,
    },
  });

  console.log('Admin user created:', admin.username);

  const defaultSettings = [
    { key: 'weekly_contribution', value: String(config.defaults.weeklyContribution), label: 'Weekly Contribution Amount', labelOm: 'Hanga Kaffaltii Torbanii' },
    { key: 'weekly_penalty', value: String(config.defaults.weeklyPenalty), label: 'Weekly Penalty Amount', labelOm: 'Hanga Adabbii Torbanii' },
    { key: 'monthly_penalty', value: String(config.defaults.monthlyPenalty), label: 'Monthly Penalty Amount', labelOm: 'Hanga Adabbii Ji\'aati' },
    { key: 'graduation_contribution', value: String(config.defaults.graduationContribution), label: 'Graduation Contribution Amount', labelOm: 'Hanga Kaffaltii Eebbifamuu' },
    { key: 'bereavement_contribution', value: String(config.defaults.bereavementContribution), label: 'Bereavement Contribution Amount', labelOm: 'Hanga Kaffaltii Du\'aa' },
    { key: 'meeting_day', value: String(config.defaults.meetingDay), label: 'Meeting Day (0=Sun, 6=Sat)', labelOm: 'Guyyaa Walga\'ii' },
    { key: 'organization_name', value: 'Afosha', label: 'Organization Name', labelOm: 'Maqaa Dhaabbataa' },
    { key: 'organization_motto', value: 'Tokkummaan Ciminaa fi Milkaayina', label: 'Motto', labelOm: 'Mata Duree' },
    {
      key: 'sms_template_payment_reminder_en',
      value: 'Reminder: Your weekly contribution of Birr {amount} is unpaid. Please pay before {dueDate}.',
      label: 'SMS Payment Reminder (English)',
      labelOm: 'Ergaa SMS Yaadachiisa Kaffaltii (Ingliffa)',
    },
    {
      key: 'sms_template_payment_reminder_om',
      value: 'Yaadachiisa: Gumaata tiyya Birr {amount} kaffalamuu qaba. Guyyaa {dueDate} dura kaffali.',
      label: 'SMS Payment Reminder (Afan Oromo)',
      labelOm: 'Ergaa SMS Yaadachiisa Kaffaltii (Afaan Oromoo)',
    },
    {
      key: 'sms_template_meeting_reminder_en',
      value: 'Reminder: A meeting is scheduled on {meetingDate}. Your attendance is required.',
      label: 'SMS Meeting Reminder (English)',
      labelOm: 'Ergaa SMS Yaadachiisa Walgahii (Ingliffa)',
    },
    {
      key: 'sms_template_meeting_reminder_om',
      value: 'Yaadachiisa: Walgahiin guyyaa {meetingDate} qophaa\'eera. Hirmaachuu siif barbaachisa.',
      label: 'SMS Meeting Reminder (Afan Oromo)',
      labelOm: 'Ergaa SMS Yaadachiisa Walgahii (Afaan Oromoo)',
    },
  ];

  for (const setting of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  const publicPages = [
    {
      slug: 'home',
      title: 'Welcome to Afosha',
      titleOm: 'Baga nagaan gara Afosha dhuftan',
      content: 'Afosha Management System — supporting members through contributions, savings, and community solidarity.',
      contentOm: 'Sirna Bulchiinsa Afosha — miseensota kaffaltii, kuusaa fi waldaa hawaasummaa tiin deeggaru.',
      sortOrder: 0,
    },
    {
      slug: 'about-afosha',
      title: 'About Afosha',
      titleOm: 'Waa\'ee Afosha',
      content: 'Afosha is a community organization dedicated to member welfare, financial discipline, and social support.',
      contentOm: 'Afosha dhaabbata hawaasummaa miseensota eeguuf, cimina faayinaansii fi deeggarsa hawaasummaa irratti xiyyeeffatu.',
      sortOrder: 1,
    },
    {
      slug: 'mission-vision',
      title: 'Mission & Vision',
      titleOm: 'Ergaa fi Mul\'ata',
      content: 'Mission: To strengthen member unity and financial sustainability.\n\nVision: A united, prosperous member community.',
      contentOm: 'Ergaa: Tokkummaa miseensotaa fi cimina faayinaansii cimsuu.\n\nMul\'ata: Hawaasa miseensotaa tokkummaa qabu fi badhaadhaa.',
      sortOrder: 2,
    },
    {
      slug: 'heera-danbii',
      title: 'Heera fi Danbii',
      titleOm: 'Heera fi Danbii',
      content: `Bu'uura akka Heera mootummaa dimokraatawaa rippaabilika Itoophiyaa keewwata (FDRE) 31 jalatti eerameen "namni kamiyyuu haala seera biyyattii, aadaa fi duudhaa hawaasaa hin faallessinen kaayyoo ykn sababa fedheef gurmaa'uu ykn gamtaadhaan ijaaramuu mirga qaba".

Kanaafuu Gamtaan dargaggoota melka jabdu qaxaa araati bu'uura heera kanaatin gamtaa seera qabeessa ta'e seera biyyatti bu'uura godhachuun, akkasumaas aadaa fi duudhaa ummataa haala hin faalleessineen fuulbana 1/1/2017 akka lakk. Itoophiyaatti hundaa'eera.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

KAAYYOO, QAJEELTOO BU'UURAA, HAALA HIRMANNAA, MIRGA FI DIRQAMOOTA MISEENSOOTA GAMTICHAA

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Kaayyoo Ijoo Gamtichaa

Gamtaan dargaggoo melka jabdu Kaayyoo armaan gadii ni qabaatu:

1. Dargaggoon akka waliin jiraatan walbarsiisuu, ijaaruu fi akka walgargaaran taasisuu.

2. Walitti dhufeenya dargaggoo Tokkummaa fi Hawaasummaa jajjabeessuu.

3. Waan xiqqoo qaban walitti fiduudhaan, dargaggoo balaan uumamaa fi nam-tolcheen irra dhaqqabe gargaaruu.

4. Hawaasaf deeggarsa namuumma kennuun hawaasni keenya akka walitti dhufeenya gaarii uumaan godhuu/taasisu.

5. Yeroo rakkoos (gaddaa) ta'ee balloos (gammachuu) wal-cinaa dhaabbachuu.

6. Safuu fi duudhaa Kutaa irraa dhufnee akka hin cabsine eeguu fi wal kabachiisuu.

7. Aadaa, duudhaa fi hawaasummaan gaariin jidduu akka jiraatu godhu.

8. Dhaloota wal gargaarsa aadeeffate, jaalalaa fi quuqama namummaa qabu oomishu.

9. Aadaa fi amantaa ofii waliif kajuu — keessumattuu Qabxii 1ffaa fi 9 caalmaatti irratti xiyyeeffannee kan hoojjannu amma.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

#Tokkummaan Ciminaa fi Milkaayina`,
      contentOm: `Bu'uura akka Heera mootummaa dimokraatawaa rippaabilika Itoophiyaa keewwata (FDRE) 31 jalatti eerameen "namni kamiyyuu haala seera biyyattii, aadaa fi duudhaa hawaasaa hin faallessinen kaayyoo ykn sababa fedheef gurmaa'uu ykn gamtaadhaan ijaaramuu mirga qaba".

Kanaafuu Gamtaan dargaggoota melka jabdu qaxaa araati bu'uura heera kanaatin gamtaa seera qabeessa ta'e seera biyyatti bu'uura godhachuun, akkasumaas aadaa fi duudhaa ummataa haala hin faalleessineen fuulbana 1/1/2017 akka lakk. Itoophiyaatti hundaa'eera.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

KAAYYOO, QAJEELTOO BU'UURAA, HAALA HIRMANNAA, MIRGA FI DIRQAMOOTA MISEENSOOTA GAMTICHAA

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Kaayyoo Ijoo Gamtichaa

Gamtaan dargaggoo melka jabdu Kaayyoo armaan gadii ni qabaatu:

1. Dargaggoon akka waliin jiraatan walbarsiisuu, ijaaruu fi akka walgargaaran taasisuu.

2. Walitti dhufeenya dargaggoo Tokkummaa fi Hawaasummaa jajjabeessuu.

3. Waan xiqqoo qaban walitti fiduudhaan, dargaggoo balaan uumamaa fi nam-tolcheen irra dhaqqabe gargaaruu.

4. Hawaasaf deeggarsa namuumma kennuun hawaasni keenya akka walitti dhufeenya gaarii uumaan godhuu/taasisu.

5. Yeroo rakkoos (gaddaa) ta'ee balloos (gammachuu) wal-cinaa dhaabbachuu.

6. Safuu fi duudhaa Kutaa irraa dhufnee akka hin cabsine eeguu fi wal kabachiisuu.

7. Aadaa, duudhaa fi hawaasummaan gaariin jidduu akka jiraatu godhu.

8. Dhaloota wal gargaarsa aadeeffate, jaalalaa fi quuqama namummaa qabu oomishu.

9. Aadaa fi amantaa ofii waliif kajuu — keessumattuu Qabxii 1ffaa fi 9 caalmaatti irratti xiyyeeffannee kan hoojjannu amma.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

#Tokkummaan Ciminaa fi Milkaayina`,
      sortOrder: 3,
    },
    {
      slug: 'contact',
      title: 'Contact Information',
      titleOm: 'Odeeffannoo Quunnamtii',
      content: 'Email: info@afosha.org\nPhone: +251 900 000 000\nAddress: Addis Ababa, Ethiopia',
      contentOm: 'Imeelii: info@afosha.org\nBilbila: +251 900 000 000\nTeessoo: Finfinnee, Itoophiyaa',
      sortOrder: 4,
    },
  ];

  for (const page of publicPages) {
    await prisma.publicContent.upsert({
      where: { slug: page.slug },
      update: { title: page.title, titleOm: page.titleOm, content: page.content, contentOm: page.contentOm, sortOrder: page.sortOrder },
      create: page,
    });
  }

  console.log('Default settings and public content created');
  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
