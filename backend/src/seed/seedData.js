import bcrypt from 'bcryptjs';
import {
  Role, User, Student, Teacher, AdminProfile, Lesson, LessonActivity,
  MCQQuestion, MCQOption, WritingTask, SpeechTask, Badge, StudentBadge,
  Group, GroupMember, GroupTask, AuditLog
} from '../models/index.js';
import { questionsForSeedLesson } from './lessonMcqBank.js';

const subjects = ['Pagbasa', 'Bokabularyo', 'Panitikan', 'Oral Comm', 'Pagsulat'];

const lessonBank = {
  1: {
    'Pagbasa': {
      title: 'Pagbasa 1: Si Ana at ang Bola',
      duration: '10 minuto',
      passage: 'Layunin: Matututuhan mo kung sino ang nasa kuwento.\n\nPanimula: Tingnan ang larawan ng batang may bola. Ano kaya ang kaniyang nilalaro?\n\nAralin: Si Ana ay may pulang bola. Nasa bakuran ang bola. Masaya si Ana habang naglalaro.\n\nGawain: Basahin ang kuwento. Hanapin kung sino ang may bola.',
      instructions: 'Basahin o pakinggan ang maikling kuwento. Pagkatapos, sagutin ang tanong.',
      question: 'Sino ang may pulang bola?',
      options: ['Ana', 'Ben', 'Lito', 'Mina'],
      correct: 0,
      speechTarget: 'Si Ana ay may pulang bola.',
      writingPrompt: 'Isulat ang pangalan ng batang may bola.',
      teacherNote: 'Grade 1 ito kaya maikli ang teksto. Gamitin ang larawan o visual card bago ipabasa ang kuwento.'
    },
    'Bokabularyo': {
      title: 'Bokabularyo 1: Mga Bagay sa Paaralan',
      duration: '10 minuto',
      passage: 'Layunin: Makikilala mo ang mga salitang ginagamit sa paaralan.\n\nPanimula: Tingnan ang mga gamit sa iyong mesa o bag.\n\nAralin: Ang lapis ay ginagamit sa pagsulat. Ang aklat ay binabasa. Ang bag ay lalagyan ng gamit. Ang papel ay sinusulatan.\n\nMga salita: lapis, aklat, bag, papel.',
      instructions: 'Basahin ang mga salita. Piliin ang gamit na ginagamit sa pagsulat.',
      question: 'Alin ang ginagamit sa pagsulat?',
      options: ['lapis', 'bola', 'plato', 'unan'],
      correct: 0,
      speechTarget: 'lapis, aklat, bag, papel',
      writingPrompt: 'Kopyahin ang salitang lapis.',
      teacherNote: 'Mainam ito gamitan ng larawan ng lapis, aklat, bag, at papel.'
    },
    'Panitikan': {
      title: 'Panitikan 1: Madaling Bugtong',
      duration: '10 minuto',
      passage: 'Layunin: Matututuhan mo ang simpleng bugtong.\n\nPanimula: Ang bugtong ay isang palaisipan.\n\nAralin: Maliit na kaibigan, kasama sa eskwela. Ginagamit sa pagsulat, hawak ng bata.\n\nGawain: Hulaan ang sagot sa bugtong.',
      instructions: 'Basahin o pakinggan ang bugtong. Piliin ang tamang sagot.',
      question: 'Ano ang sagot sa bugtong?',
      options: ['lapis', 'sapatos', 'kutsara', 'bola'],
      correct: 0,
      speechTarget: 'Ang sagot sa bugtong ay lapis.',
      writingPrompt: 'Isulat ang sagot sa bugtong.',
      teacherNote: 'Panatilihing konkreto ang bugtong para madaling maunawaan ng Grade 1.'
    },
    'Oral Comm': {
      title: 'Oral Comm 1: Pagbati at Pagpapakilala',
      duration: '10 minuto',
      passage: 'Layunin: Makapagpapakilala ka gamit ang simpleng pangungusap.\n\nPanimula: Kapag may bagong kakilala, maaari tayong bumati.\n\nAralin: Magandang araw. Ako si Ana. Ako ay nasa Unang Baitang.\n\nGawain: Pakinggan muna. Pagkatapos, bigkasin nang malinaw.',
      instructions: 'Pindutin ang Pakinggan. Ulitin ang pangungusap at i-record ang iyong boses.',
      question: 'Ano ang unang sinasabi kapag bumabati?',
      options: ['Magandang araw', 'Paalam', 'Ayoko po', 'Bukas na lang'],
      correct: 0,
      speechTarget: 'Magandang araw. Ako si Ana.',
      writingPrompt: 'Isulat ang iyong pangalan.',
      teacherNote: 'Bigyan ng positibong feedback ang bata kahit mabagal ang pagbigkas.'
    },
    'Pagsulat': {
      title: 'Pagsulat 1: Payak na Pangungusap',
      duration: '10 minuto',
      passage: 'Layunin: Makokopya mo ang isang payak na pangungusap.\n\nPanimula: Ang pangungusap ay nagsasabi ng buong diwa.\n\nAralin: Ako ay masaya.\n\nGawain: Basahin at kopyahin ang pangungusap.',
      instructions: 'Kopyahin ang pangungusap nang malinaw.',
      question: 'Ano ang pangungusap na kokopyahin?',
      options: ['Ako ay masaya.', 'Takbo pula mesa.', 'Lapis bola aso.', 'Sa ay ang.'],
      correct: 0,
      speechTarget: 'Ako ay masaya.',
      writingPrompt: 'Isulat: Ako ay masaya.',
      teacherNote: 'Para sa Grade 1, sapat na ang pagkopya ng salita o isang payak na pangungusap.'
    }
  },
  2: {
    'Pagbasa': {
      title: 'Pagbasa 2: Ang Punong Mangga',
      duration: '10 minuto',
      passage: 'Layunin: Masasagot mo ang tanong na sino, ano, at saan sa kuwento.\n\nPanimula: May mga punong nagbibigay ng bunga at lilim.\n\nAralin: May malaking puno ng mangga sa bakuran nina Lolo Mario. Tuwing hapon, naglalaro sina Nena at Kiko sa ilalim nito. Isang araw, namitas sila ng hinog na mangga at ibinigay ito kay Lola.\n\nGawain: Basahin ang kuwento at alamin kung saan naglalaro ang mga bata.',
      instructions: 'Basahin ang kuwento. Sagutin ang tanong pagkatapos.',
      question: 'Saan naglalaro sina Nena at Kiko?',
      options: ['sa ilalim ng puno', 'sa palengke', 'sa kusina', 'sa simbahan'],
      correct: 0,
      speechTarget: 'May malaking puno ng mangga sa bakuran.',
      writingPrompt: 'Isulat kung saan naglalaro sina Nena at Kiko.',
      teacherNote: 'Pagtuunan ang pag-unawa sa tauhan at tagpuan.'
    },
    'Bokabularyo': {
      title: 'Bokabularyo 2: Mga Salitang Kilos',
      duration: '10 minuto',
      passage: 'Layunin: Makikilala mo ang salitang kilos sa pangungusap.\n\nPanimula: Ang salitang kilos ay nagsasabi ng ginagawa.\n\nAralin: Tumakbo si Ben. Umawit si Maya. Nagbasa si Lira.\n\nGawain: Hanapin ang salitang nagpapakita ng kilos.',
      instructions: 'Basahin ang pangungusap. Piliin ang salitang kilos.',
      question: 'Sa pangungusap na "Nagbasa si Lira," alin ang salitang kilos?',
      options: ['Nagbasa', 'Lira', 'si', 'pangungusap'],
      correct: 0,
      speechTarget: 'Nagbasa si Lira.',
      writingPrompt: 'Gamitin ang salitang tumakbo sa pangungusap.',
      teacherNote: 'Maaaring ipaaksyon sa mag-aaral ang salitang kilos.'
    },
    'Panitikan': {
      title: 'Panitikan 2: Tula tungkol sa Pamilya',
      duration: '12 minuto',
      passage: 'Layunin: Matutukoy mo ang paksa ng maikling tula.\n\nPanimula: Ang tula ay nagpapahayag ng damdamin.\n\nAralin: Ang Aking Pamilya\n\nSa bahay naming maliit,\nmay pagmamahalang tunay.\nSina Nanay at Tatay,\ngabay sa aking buhay.\n\nGawain: Basahin ang tula at tukuyin ang paksa.',
      instructions: 'Basahin ang tula. Piliin ang paksang tinutukoy nito.',
      question: 'Tungkol saan ang tula?',
      options: ['pamilya', 'pagkain', 'paaralan', 'laruan'],
      correct: 0,
      speechTarget: 'Ang aking pamilya ay mahalaga.',
      writingPrompt: 'Isulat ang isang taong mahalaga sa iyong pamilya.',
      teacherNote: 'Ipaliwanag na ang tula ay maaaring may tugma at damdamin.'
    },
    'Oral Comm': {
      title: 'Oral Comm 2: Pagsunod sa Panuto',
      duration: '10 minuto',
      passage: 'Layunin: Makasusunod ka sa simple at dalawang hakbang na panuto.\n\nPanimula: Mahalaga ang pakikinig upang makasunod sa panuto.\n\nAralin: Kunin ang lapis at isulat ang iyong pangalan. Buksan ang aklat at basahin ang unang pangungusap.\n\nGawain: Pakinggan ang panuto at sabihin kung ano ang unang gagawin.',
      instructions: 'Pakinggan ang panuto. Piliin ang unang dapat gawin.',
      question: 'Sa panutong "Kunin ang lapis at isulat ang pangalan," ano ang unang gagawin?',
      options: ['Kunin ang lapis', 'Maglaro', 'Kumain', 'Matulog'],
      correct: 0,
      speechTarget: 'Kukunin ko ang lapis at isusulat ko ang aking pangalan.',
      writingPrompt: 'Isulat ang unang gagawin sa panuto.',
      teacherNote: 'Ang aralin ay para sa pakikinig at pagsunod sa classroom instructions.'
    },
    'Pagsulat': {
      title: 'Pagsulat 2: Payak na Pangungusap',
      duration: '12 minuto',
      passage: 'Layunin: Makabubuo ka ng payak na pangungusap gamit ang isang salita.\n\nPanimula: Ang pangungusap ay nagsisimula sa malaking titik at nagtatapos sa bantas.\n\nAralin: Salita: paaralan. Halimbawa: Ako ay pumapasok sa paaralan.\n\nGawain: Gumawa ng pangungusap gamit ang ibinigay na salita.',
      instructions: 'Gamitin ang salita sa isang pangungusap.',
      question: 'Alin ang tamang pangungusap?',
      options: ['Ako ay nagbabasa ng aklat.', 'Aklat ang sa ay.', 'Nag ang ako.', 'Si aklat tumakbo.'],
      correct: 0,
      speechTarget: 'Ako ay nagbabasa ng aklat.',
      writingPrompt: 'Gumawa ng pangungusap gamit ang salitang aklat.',
      teacherNote: 'Tanggapin ang iba ibang sagot basta malinaw ang diwa at tama ang gamit ng salita.'
    }
  },
  3: {
    'Pagbasa': {
      title: 'Pagbasa 3: Ang Batang Matulungin',
      duration: '12 minuto',
      passage: 'Layunin: Matutukoy mo ang pangunahing ideya ng talata.\n\nPanimula: Ang pangunahing ideya ang pinakamahalagang kaisipan ng binasa.\n\nAralin: Tuwing umaga, tinutulungan ni Carlo ang kaniyang lola sa pagdidilig ng halaman. Pagkatapos ng klase, inaayos niya ang kaniyang gamit at tumutulong sa pagliligpit ng mesa. Masaya si Carlo kapag nakatutulong siya sa kaniyang pamilya.\n\nGawain: Basahin ang talata at tukuyin ang pangunahing ideya.',
      instructions: 'Basahin ang talata. Piliin ang pangunahing ideya.',
      question: 'Ano ang pangunahing ideya ng talata?',
      options: ['Si Carlo ay batang matulungin.', 'Si Carlo ay mahilig matulog.', 'Si Carlo ay ayaw sa halaman.', 'Si Carlo ay naglalaro buong araw.'],
      correct: 0,
      speechTarget: 'Masaya si Carlo kapag nakatutulong siya.',
      writingPrompt: 'Sumulat ng isang pangungusap tungkol sa pagtulong.',
      teacherNote: 'Ipaalala na ang pangunahing ideya ay ang pinakamahalagang kaisipan ng teksto.'
    },
    'Bokabularyo': {
      title: 'Bokabularyo 3: Mga Salitang Naglalarawan',
      duration: '12 minuto',
      passage: 'Layunin: Makikilala mo ang salitang naglalarawan.\n\nPanimula: Ang salitang naglalarawan ay nagsasabi ng katangian ng tao, bagay, hayop, lugar, o pangyayari.\n\nAralin: Mabango ang bulaklak. Mataas ang puno. Masipag ang bata.\n\nGawain: Hanapin ang salitang naglalarawan sa pangungusap.',
      instructions: 'Basahin ang pangungusap. Piliin ang salitang naglalarawan.',
      question: 'Sa pangungusap na "Mabango ang bulaklak," alin ang salitang naglalarawan?',
      options: ['Mabango', 'bulaklak', 'ang', 'pangungusap'],
      correct: 0,
      speechTarget: 'Masipag ang bata.',
      writingPrompt: 'Gamitin ang salitang masipag sa pangungusap.',
      teacherNote: 'Magbigay ng dagdag na halimbawa gamit ang mga bagay sa silid-aralan.'
    },
    'Panitikan': {
      title: 'Panitikan 3: Ang Maya at ang Uwak',
      duration: '12 minuto',
      passage: 'Layunin: Matutukoy mo ang aral sa isang maikling pabula.\n\nPanimula: Ang pabula ay kuwento na karaniwang hayop ang tauhan at may aral.\n\nAralin: Nakita ng uwak ang maya na nag-iipon ng sanga para sa pugad. "Bakit ka nagpapagod?" tanong ng uwak. Sumagot ang maya, "Naghahanda ako bago dumating ang ulan." Hindi nakinig ang uwak. Nang umulan, ligtas ang maya sa pugad, ngunit basa at malamig ang uwak.\n\nGawain: Piliin ang aral ng kuwento.',
      instructions: 'Basahin ang pabula. Piliin ang aral ng kuwento.',
      question: 'Ano ang aral ng pabula?',
      options: ['Mahalagang maghanda.', 'Dapat maging tamad.', 'Huwag gumawa ng pugad.', 'Laging maglaro sa ulan.'],
      correct: 0,
      speechTarget: 'Mahalaga ang paghahanda.',
      writingPrompt: 'Isulat ang aral ng pabula sa isang pangungusap.',
      teacherNote: 'Iugnay ang aral sa paghahanda ng gamit bago pumasok sa paaralan.'
    },
    'Oral Comm': {
      title: 'Oral Comm 3: Pagkukuwento ng Karanasan',
      duration: '12 minuto',
      passage: 'Layunin: Makapagsasalaysay ka ng maikling karanasan gamit ang dalawa hanggang tatlong pangungusap.\n\nPanimula: Kapag nagkukuwento, sabihin kung saan nangyari, sino ang kasama, at ano ang nangyari.\n\nAralin: Kahapon, pumunta ako sa parke. Kasama ko ang aking kapatid. Masaya kaming naglaro.\n\nGawain: I-record ang iyong boses habang nagsasalaysay ng isang masayang karanasan.',
      instructions: 'Sabihin ang iyong karanasan gamit ang malinaw na boses.',
      question: 'Ano ang mahalagang sabihin sa pagkukuwento ng karanasan?',
      options: ['Saan nangyari at ano ang nangyari', 'Presyo ng pagkain', 'Laki ng sapatos', 'Bilang ng upuan'],
      correct: 0,
      speechTarget: 'Kahapon, pumunta ako sa parke.',
      writingPrompt: 'Sumulat ng dalawang pangungusap tungkol sa isang masayang karanasan.',
      teacherNote: 'Tingnan kung may simula, gitna, at wakas kahit maikli lamang.'
    },
    'Pagsulat': {
      title: 'Pagsulat 3: Maikling Talata',
      duration: '15 minuto',
      passage: 'Layunin: Makasusulat ka ng maikling talata tungkol sa isang paksa.\n\nPanimula: Ang talata ay binubuo ng magkakaugnay na pangungusap.\n\nAralin: Paborito ko ang sinigang. Masarap ito lalo na kapag mainit. Kumakain ako nito kasama ang aking pamilya.\n\nGawain: Sumulat ng tatlong pangungusap tungkol sa iyong paboritong pagkain.',
      instructions: 'Sumulat ng 3 pangungusap tungkol sa iyong paboritong pagkain.',
      question: 'Ilang pangungusap ang kailangang isulat?',
      options: ['3', '1', '8', '10'],
      correct: 0,
      speechTarget: 'Paborito ko ang sinigang.',
      writingPrompt: 'Sumulat ng 3 pangungusap tungkol sa iyong paboritong pagkain.',
      teacherNote: 'Suriin kung magkakaugnay ang tatlong pangungusap.'
    }
  },
  4: {
    'Pagbasa': {
      title: 'Pagbasa 4: Pangangalaga sa Tubig',
      duration: '12 minuto',
      passage: 'Layunin: Makukuha mo ang mahahalagang detalye mula sa tekstong impormatibo.\n\nPanimula: Ang tekstong impormatibo ay nagbibigay ng kaalaman tungkol sa isang paksa.\n\nAralin: Mahalaga ang tubig sa araw-araw na pamumuhay. Ginagamit natin ito sa pag-inom, pagluluto, paglilinis, at pagdidilig ng halaman. Upang makatipid, isara ang gripo kapag hindi ginagamit. Maaari ring gumamit ng timba sa paghuhugas upang hindi masayang ang tubig.\n\nGawain: Basahin ang teksto at hanapin ang paraan ng pagtitipid ng tubig.',
      instructions: 'Basahin ang teksto. Sagutin ang tanong tungkol sa detalye.',
      question: 'Ano ang isang paraan upang makatipid ng tubig?',
      options: ['Isara ang gripo kapag hindi ginagamit.', 'Hayaang bukas ang gripo.', 'Maglaro ng tubig araw-araw.', 'Itapon ang malinis na tubig.'],
      correct: 0,
      speechTarget: 'Isara ang gripo kapag hindi ginagamit.',
      writingPrompt: 'Sumulat ng isang paraan ng pagtitipid ng tubig.',
      teacherNote: 'Ang tekstong ito ay nakatutulong sa pagbasa ng impormatibong teksto.'
    },
    'Bokabularyo': {
      title: 'Bokabularyo 4: Kasingkahulugan at Kasalungat',
      duration: '12 minuto',
      passage: 'Layunin: Matutukoy mo ang kasingkahulugan at kasalungat ng salita.\n\nPanimula: May mga salitang magkapareho ang kahulugan at may mga salitang magkasalungat.\n\nAralin: Ang kasingkahulugan ay salitang kapareho o malapit ang kahulugan. Ang kasalungat ay salitang kabaligtaran ang kahulugan. Halimbawa: mabilis at matulin; mabilis at mabagal.\n\nGawain: Piliin ang kasalungat ng salita.',
      instructions: 'Basahin ang salita. Piliin ang kasalungat nito.',
      question: 'Ano ang kasalungat ng salitang "malinis"?',
      options: ['marumi', 'maayos', 'mabango', 'maganda'],
      correct: 0,
      speechTarget: 'Ang kasalungat ng mabilis ay mabagal.',
      writingPrompt: 'Gamitin ang salitang malinis sa pangungusap.',
      teacherNote: 'Magbigay pa ng pares ng salita mula sa karanasan ng mga bata.'
    },
    'Panitikan': {
      title: 'Panitikan 4: Alamat ng Munting Bituin',
      duration: '14 minuto',
      passage: 'Layunin: Matutukoy mo ang tauhan, tagpuan, at aral sa alamat.\n\nPanimula: Ang alamat ay kuwentong nagpapaliwanag ng pinagmulan ng isang bagay sa malikhaing paraan.\n\nAralin: Noong unang panahon, may isang batang mahilig tumulong sa mga naliligaw sa gabi. Dala niya ang maliit na ilawan upang makita ng mga tao ang daan. Isang gabi, nawala ang kaniyang ilawan, ngunit nagliwanag ang langit. Mula noon, sinasabing ang kaniyang kabutihan ay naging munting bituin na gumagabay sa gabi.\n\nGawain: Basahin ang alamat at tukuyin ang katangian ng bata.',
      instructions: 'Basahin ang alamat. Sagutin ang tanong pagkatapos.',
      question: 'Ano ang katangian ng bata sa alamat?',
      options: ['matulungin', 'tamad', 'masungit', 'makakalimutin'],
      correct: 0,
      speechTarget: 'Ang munting bituin ay gabay sa dilim.',
      writingPrompt: 'Isulat ang aral ng alamat.',
      teacherNote: 'Ipaliwanag ang pagkakaiba ng alamat at karaniwang kuwento.'
    },
    'Oral Comm': {
      title: 'Oral Comm 4: Pakikipanayam',
      duration: '12 minuto',
      passage: 'Layunin: Makabubuo ka ng angkop at magalang na tanong sa pakikipanayam.\n\nPanimula: Ang pakikipanayam ay pagtatanong upang makakuha ng impormasyon.\n\nAralin: Dapat magalang ang tono at malinaw ang tanong. Halimbawa: Magandang araw po. Maaari po ba akong magtanong?\n\nGawain: Piliin ang magalang na tanong sa pakikipanayam.',
      instructions: 'Basahin ang sitwasyon. Piliin ang angkop na tanong.',
      question: 'Alin ang magalang na tanong sa pakikipanayam?',
      options: ['Maaari po ba akong magtanong?', 'Sagutin mo ako ngayon!', 'Bakit ayaw mo magsalita?', 'Bilisan mo ang sagot!'],
      correct: 0,
      speechTarget: 'Magandang araw po. Maaari po ba akong magtanong?',
      writingPrompt: 'Sumulat ng isang magalang na tanong para sa panayam.',
      teacherNote: 'Gamitin ito para sa pagsasanay sa magalang na pananalita.'
    },
    'Pagsulat': {
      title: 'Pagsulat 4: Talatang May Paksang Pangungusap',
      duration: '15 minuto',
      passage: 'Layunin: Makasusulat ka ng talata na may malinaw na paksang pangungusap.\n\nPanimula: Ang paksang pangungusap ang nagsasabi ng pangunahing ideya ng talata.\n\nAralin: Masaya ang aking paaralan. May mababait akong guro at kaibigan. Natututo ako araw-araw. Mas gusto kong pumasok kapag handa ang aking gamit.\n\nGawain: Sumulat ng apat na pangungusap tungkol sa iyong paaralan.',
      instructions: 'Sumulat ng 4 na pangungusap tungkol sa iyong paaralan.',
      question: 'Ano ang tawag sa pangungusap na nagsasabi ng pangunahing ideya?',
      options: ['paksang pangungusap', 'hulaping salita', 'tanong', 'pamuhatan'],
      correct: 0,
      speechTarget: 'Masaya ang aking paaralan.',
      writingPrompt: 'Sumulat ng 4 na pangungusap tungkol sa iyong paaralan.',
      teacherNote: 'Suriin kung may pangunahing paksa at magkakaugnay ang mga pangungusap.'
    }
  },
  5: {
    'Pagbasa': {
      title: 'Pagbasa 5: Barangay Clean-Up Drive',
      duration: '15 minuto',
      passage: 'Layunin: Matutukoy mo ang sanhi at bunga sa binasang teksto.\n\nPanimula: Ang sanhi ang dahilan ng pangyayari. Ang bunga ang naging resulta nito.\n\nAralin: Napansin ng mga residente na dumarami ang basura sa kanal. Dahil dito, bumabaha tuwing malakas ang ulan. Naglunsad ang barangay ng clean-up drive upang linisin ang paligid. Pagkatapos ng gawain, naging mas maayos ang daloy ng tubig at mas malinis ang daan.\n\nGawain: Tukuyin ang bunga ng pagdami ng basura sa kanal.',
      instructions: 'Basahin ang teksto. Tukuyin ang sanhi at bunga.',
      question: 'Ano ang bunga ng pagdami ng basura sa kanal?',
      options: ['Bumabara ang kanal at bumabaha.', 'Lalong lumilinis ang daan.', 'Dumadami ang halaman.', 'Nawawala ang ulan.'],
      correct: 0,
      speechTarget: 'Dumarami ang basura kaya bumabaha sa kanal.',
      writingPrompt: 'Sumulat ng isang halimbawa ng sanhi at bunga.',
      teacherNote: 'Iugnay ang sanhi at bunga sa pang-araw-araw na pangyayari sa komunidad.'
    },
    'Bokabularyo': {
      title: 'Bokabularyo 5: Sawikain at Kahulugan',
      duration: '15 minuto',
      passage: 'Layunin: Maipaliliwanag mo ang kahulugan ng payak na sawikain.\n\nPanimula: Ang sawikain ay pahayag na hindi tuwirang nagsasabi ng kahulugan.\n\nAralin: Bukal sa loob ang ibig sabihin ay taos-puso o kusang-loob. Butas ang bulsa ang ibig sabihin ay kapos sa pera. Magaan ang kamay ang ibig sabihin ay mabilis manakit.\n\nGawain: Piliin ang kahulugan ng sawikain.',
      instructions: 'Basahin ang sawikain. Piliin ang kahulugan nito.',
      question: 'Ano ang ibig sabihin ng "bukal sa loob"?',
      options: ['taos-puso', 'galit', 'pagod', 'mabilis'],
      correct: 0,
      speechTarget: 'Bukal sa loob ang kaniyang pagtulong.',
      writingPrompt: 'Gamitin ang sawikaing bukal sa loob sa pangungusap.',
      teacherNote: 'Magbigay ng pangungusap para makita ang gamit ng sawikain sa konteksto.'
    },
    'Panitikan': {
      title: 'Panitikan 5: Tula ng Bayanihan',
      duration: '15 minuto',
      passage: 'Layunin: Matutukoy mo ang mensahe ng tula.\n\nPanimula: Ang tula ay maaaring magpahayag ng pagpapahalaga sa kapwa at pamayanan.\n\nAralin: Bayanihan\n\nKapag may bigat na pasan,\nkamay-kamay ay nagtutulungan.\nSa hirap man o saya,\nkapwa ang laging kasama.\n\nSa munting gawa ng bawat isa,\ngumagaan ang problema.\nBayanihang tunay at tapat,\ndaan sa pamayanang maunlad.\n\nGawain: Tukuyin ang pangunahing mensahe ng tula.',
      instructions: 'Basahin ang tula. Piliin ang mensahe nito.',
      question: 'Ano ang pangunahing mensahe ng tula?',
      options: ['Mahalaga ang pagtutulungan.', 'Dapat mag-isa palagi.', 'Iwasan ang kapwa.', 'Huwag tumulong sa iba.'],
      correct: 0,
      speechTarget: 'Sa bayanihan, tayo ay nagtutulungan.',
      writingPrompt: 'Sumulat ng isang pangungusap tungkol sa bayanihan.',
      teacherNote: 'Iugnay ang tula sa group tasks ng Tuklas Talino.'
    },
    'Oral Comm': {
      title: 'Oral Comm 5: Pagpapahayag ng Opinyon',
      duration: '15 minuto',
      passage: 'Layunin: Makapagpapahayag ka ng sariling opinyon gamit ang magalang na pananalita.\n\nPanimula: Sa pagbibigay ng opinyon, mahalagang malinaw ang paninindigan at may dahilan.\n\nAralin: Maaaring gamitin ang: Para sa akin, Sa aking palagay, Naniniwala ako na. Paksa: Mahalaga ba ang pagbabasa araw-araw?\n\nGawain: Magbigay ng dalawang pangungusap na opinyon tungkol sa pagbabasa.',
      instructions: 'Basahin ang paksa. I-record ang iyong opinyon.',
      question: 'Alin ang panimula sa pagpapahayag ng opinyon?',
      options: ['Para sa akin', 'Noong unang panahon', 'Minsan sa gubat', 'Sila ay tumakbo'],
      correct: 0,
      speechTarget: 'Para sa akin, mahalaga ang pagbabasa araw-araw.',
      writingPrompt: 'Sumulat ng dalawang pangungusap na opinyon tungkol sa pagbabasa.',
      teacherNote: 'Tingnan kung may malinaw na opinyon at dahilan ang sagot.'
    },
    'Pagsulat': {
      title: 'Pagsulat 5: Liham Paanyaya',
      duration: '15 minuto',
      passage: 'Layunin: Makasusulat ka ng simpleng liham paanyaya.\n\nPanimula: Ang liham paanyaya ay ginagamit upang anyayahan ang isang tao sa isang gawain.\n\nAralin: Mahal kong Kaibigan,\nInaanyayahan kita sa aming palatuntunan sa Biyernes. Gaganapin ito sa silid-aralan sa ika-9 ng umaga. Sana ay makadalo ka.\nLubos na gumagalang,\nLia\n\nGawain: Sumulat ng maikling liham paanyaya para sa isang programa sa paaralan.',
      instructions: 'Gumawa ng sariling liham paanyaya.',
      question: 'Ano ang layunin ng liham paanyaya?',
      options: ['mag-anyaya', 'manakot', 'magtago', 'manisi'],
      correct: 0,
      speechTarget: 'Inaanyayahan kita sa aming palatuntunan.',
      writingPrompt: 'Sumulat ng maikling liham paanyaya para sa isang programa sa paaralan.',
      teacherNote: 'Suriin kung may pagbati, katawan ng liham, at pangwakas.'
    }
  },
  6: {
    'Pagbasa': {
      title: 'Pagbasa 6: Bakit Mahalaga ang Pagbabasa',
      duration: '15 minuto',
      passage: 'Layunin: Matutukoy mo ang layunin ng may-akda at pangunahing argumento ng teksto.\n\nPanimula: Ang may-akda ay may layunin sa pagsulat, tulad ng manghikayat, magpaliwanag, o magbigay-impormasyon.\n\nAralin: Mahalaga ang pagbabasa dahil pinalalawak nito ang kaalaman at pag-unawa ng isang mag-aaral. Sa pagbabasa, natututuhan ng bata ang bagong salita, impormasyon, at pananaw. Nakakatulong din ito sa mas mahusay na pagsulat at pagsasalita. Kaya dapat gawing ugali ang pagbabasa araw-araw, kahit ilang minuto lamang.\n\nGawain: Tukuyin ang layunin ng may-akda.',
      instructions: 'Basahin ang teksto. Tukuyin ang layunin ng may-akda.',
      question: 'Ano ang layunin ng may-akda?',
      options: ['Hikayatin ang mag-aaral na magbasa araw-araw.', 'Magkuwento tungkol sa laro.', 'Magbigay ng alamat.', 'Magpaliwanag ng panaginip.'],
      correct: 0,
      speechTarget: 'Ang pagbabasa ay nagpapalawak ng kaalaman.',
      writingPrompt: 'Ipaliwanag sa dalawang pangungusap kung bakit mahalaga ang pagbabasa.',
      teacherNote: 'Para sa Grade 6, maaaring itanong ang ebidensyang ginamit ng may-akda.'
    },
    'Bokabularyo': {
      title: 'Bokabularyo 6: Mga Salitang Pang-ugnay',
      duration: '15 minuto',
      passage: 'Layunin: Magagamit mo ang pang-ugnay upang malinaw na maipakita ang relasyon ng mga ideya.\n\nPanimula: Ang pang-ugnay ay tumutulong upang magkaugnay ang mga salita, parirala, o pangungusap.\n\nAralin: Ginagamit ang dahil upang magbigay ng dahilan. Ginagamit ang kaya upang ipakita ang bunga. Ginagamit ang ngunit upang ipakita ang pagsalungat. Halimbawa: Nag-aral siya nang mabuti kaya mataas ang kaniyang marka.\n\nGawain: Piliin ang angkop na pang-ugnay.',
      instructions: 'Basahin ang pangungusap. Piliin ang tamang pang-ugnay.',
      question: 'Naglinis ang mga bata, _____ gumanda ang silid-aralan.',
      options: ['kaya', 'ngunit', 'kung', 'dahil sa kabila'],
      correct: 0,
      speechTarget: 'Naglinis ang mga bata kaya gumanda ang silid-aralan.',
      writingPrompt: 'Gumawa ng pangungusap gamit ang salitang kaya.',
      teacherNote: 'Iugnay ang pang-ugnay sa sanhi, bunga, at pagsalungat.'
    },
    'Panitikan': {
      title: 'Panitikan 6: Maikling Kuwento at Tema',
      duration: '15 minuto',
      passage: 'Layunin: Matutukoy mo ang tema ng maikling kuwento.\n\nPanimula: Ang tema ay pangunahing kaisipan o mensahe ng akda.\n\nAralin: Si Mira ay laging nahihiyang magbasa sa harap ng klase. Isang araw, hinikayat siya ng kaniyang guro na subukan kahit isang talata lamang. Nagkamali siya sa unang basa, ngunit hindi siya tumigil. Sa paulit-ulit na pagsasanay, unti-unti siyang naging mas malinaw at tiwala sa sarili.\n\nGawain: Tukuyin ang tema ng kuwento.',
      instructions: 'Basahin ang kuwento. Piliin ang tema nito.',
      question: 'Ano ang tema ng kuwento?',
      options: ['Nagbubunga ang pagsasanay at tiyaga.', 'Mas mabuti ang hindi sumubok.', 'Dapat iwasan ang pagbabasa.', 'Laging tama ang unang subok.'],
      correct: 0,
      speechTarget: 'Nagbubunga ang pagsasanay at tiyaga.',
      writingPrompt: 'Sumulat ng dalawang pangungusap tungkol sa aral ng kuwento.',
      teacherNote: 'Gabayan ang mag-aaral na ibukod ang tema sa simpleng pangyayari lamang.'
    },
    'Oral Comm': {
      title: 'Oral Comm 6: Maikling Talumpati',
      duration: '15 minuto',
      passage: 'Layunin: Makapaghahanda ka ng maikling talumpati na may malinaw na mensahe.\n\nPanimula: Ang talumpati ay pagsasalita sa harap ng tagapakinig tungkol sa isang paksa.\n\nAralin: Sa talumpati, mahalaga ang malinaw na simula, katawan, at wakas. Paksa: Bakit mahalaga ang respeto sa paaralan?\n\nGawain: Bumuo at bigkasin ang tatlo hanggang apat na pangungusap tungkol sa respeto.',
      instructions: 'I-record ang maikling talumpati gamit ang malinaw na boses.',
      question: 'Ano ang mahalagang bahagi ng talumpati?',
      options: ['simula, katawan, at wakas', 'kulay, hugis, at bilang', 'laro, pagkain, at tulog', 'lapis, papel, at bag'],
      correct: 0,
      speechTarget: 'Mahalaga ang respeto upang maging maayos ang ating paaralan.',
      writingPrompt: 'Sumulat ng maikling talumpati tungkol sa respeto.',
      teacherNote: 'Tingnan ang linaw ng mensahe, ayos ng ideya, at kumpiyansa sa pagsasalita.'
    },
    'Pagsulat': {
      title: 'Pagsulat 6: Maikling Sanaysay ng Opinyon',
      duration: '18 minuto',
      passage: 'Layunin: Makasusulat ka ng maikling sanaysay na nagpapahayag ng opinyon at dahilan.\n\nPanimula: Ang sanaysay ng opinyon ay nagsasabi ng paniniwala ng manunulat at nagbibigay ng paliwanag.\n\nAralin: Paksa: Dapat bang magbasa ang mga mag-aaral araw-araw? Sa pagsulat, gumamit ng panimula, dahilan, at pangwakas na pangungusap.\n\nGawain: Sumulat ng limang pangungusap tungkol sa iyong opinyon.',
      instructions: 'Sumulat ng maikling sanaysay ng opinyon na may dahilan.',
      question: 'Ano ang dapat kasama sa sanaysay ng opinyon?',
      options: ['opinyon at dahilan', 'pangalan lamang', 'listahan ng gamit', 'numero lamang'],
      correct: 0,
      speechTarget: 'Naniniwala ako na mahalaga ang pagbabasa araw-araw.',
      writingPrompt: 'Sumulat ng 5 pangungusap tungkol sa tanong: Dapat bang magbasa ang mga mag-aaral araw-araw?',
      teacherNote: 'Suriin kung may malinaw na opinyon, dahilan, at pangwakas.'
    }
  }
};

function lessonBody(subject, grade) {
  const gradeLessons = lessonBank[grade];
  if (!gradeLessons || !gradeLessons[subject]) {
    throw new Error(`Missing seeded lesson content for Grade ${grade} ${subject}`);
  }
  return gradeLessons[subject];
}

function codeFor(subject) {
  return subject === 'Pagbasa' ? 'PAG'
    : subject === 'Bokabularyo' ? 'WIK'
    : subject === 'Panitikan' ? 'PAN'
    : subject === 'Oral Comm' ? 'ORA'
    : 'SUL';
}

async function createUser(roleName, username, password, displayName, email = null) {
  const role = await Role.findOne({ where: { name: roleName } });
  return User.create({
    roleId: role.id,
    username,
    email,
    displayName,
    passwordHash: await bcrypt.hash(password, 12),
    status: 'active'
  });
}

export async function seedData() {
  await Role.bulkCreate([{ name: 'admin' }, { name: 'teacher' }, { name: 'student' }], { ignoreDuplicates: true });

  const adminUser = await createUser('admin', 'admin', process.env.DEMO_ADMIN_PASSWORD || 'admin123', 'System Admin');
  await AdminProfile.create({ userId: adminUser.id, name: 'System Admin' });

  const teacherUser = await createUser('teacher', 'teacher1', process.env.DEMO_TEACHER_PASSWORD || 'teach123', 'Teacher 1');
  const teacher = await Teacher.create({ userId: teacherUser.id, employeeCode: 'TCH-2025-001', name: 'Teacher 1' });

  const demoStudents = [
    ['STU-2025-001','Lia',1,'Bulaklak','🦋'],
    ['STU-2025-002','Noah',2,'Bituin','🐸'],
    ['STU-2025-003','Juan',3,'Bulaklak','🦊'],
    ['STU-2025-004','Maya',4,'Matalino','🐨'],
    ['STU-2025-005','Paolo',5,'Masigasig','🦁'],
    ['STU-2025-006','Aira',6,'Mapanuri','🐼']
  ];
  const createdStudents = [];
  for (const [studentCode, name, gradeLevel, section, avatar] of demoStudents) {
    const user = await createUser('student', studentCode, process.env.DEMO_STUDENT_PASSWORD || 'student123', name);
    const student = await Student.create({ userId: user.id, studentCode, name, gradeLevel, section, avatar, xp: 0, status: 'active' });
    createdStudents.push(student);
  }

  await Badge.bulkCreate([
    { code: 'FIRST_LESSON', name: 'Unang Hakbang', icon: '🌱', description: 'Nakumpleto ang unang aralin.', xpThreshold: 20 },
    { code: 'READER', name: 'Batang Mambabasa', icon: '📖', description: 'Masipag sa pagbabasa.', xpThreshold: 75 },
    { code: 'WRITER', name: 'Sagot Star', icon: '✍️', description: 'Complete 3 Gawain activities.', xpThreshold: 120 },
    { code: 'SPEAKER', name: 'Mahusay Magsalita', icon: '🎙️', description: 'Nagsanay sa oral communication.', xpThreshold: 160 },
    { code: 'TEAMWORK', name: 'Kasama sa Pangkat', icon: '🤝', description: 'Nakilahok sa pangkatang gawain.', xpThreshold: 200 }
  ], { ignoreDuplicates: true });

  const defaultGawainMap = {
    'G1-PAG-01': {
      prompt: 'Si Ana ay may ____.',
      rubric: {
        gawainType: 'complete_sentence',
        template: 'Si Ana ay may ____.',
        choices: ['bola', 'aklat'],
        wordBank: ['bola', 'aklat'],
        correctAnswer: 'bola',
        acceptedAnswers: ['bola', 'Si Ana ay may bola.'],
        correctWords: ['bola'],
        autoChecked: true
      }
    },
    'G1-WIK-01': {
      prompt: 'Ang ____ ay ginagamit sa pagsulat.',
      rubric: {
        gawainType: 'complete_sentence',
        template: 'Ang ____ ay ginagamit sa pagsulat.',
        choices: ['lapis', 'bola'],
        wordBank: ['lapis', 'bola'],
        correctAnswer: 'lapis',
        acceptedAnswers: ['lapis', 'Ang lapis ay ginagamit sa pagsulat.'],
        correctWords: ['lapis'],
        autoChecked: true
      }
    },
    'G1-PAN-01': {
      prompt: 'Ang sagot sa bugtong ay ____.',
      rubric: {
        gawainType: 'complete_sentence',
        template: 'Ang sagot sa bugtong ay ____.',
        choices: ['lapis', 'bola'],
        wordBank: ['lapis', 'bola'],
        correctAnswer: 'lapis',
        acceptedAnswers: ['lapis', 'Ang sagot sa bugtong ay lapis.'],
        correctWords: ['lapis'],
        autoChecked: true
      }
    },
    'G1-ORA-01': {
      prompt: 'Ako si ____.',
      rubric: {
        gawainType: 'complete_sentence',
        template: 'Ako si ____.',
        choices: ['Ana', 'bola'],
        wordBank: ['Ana', 'bola'],
        correctAnswer: 'Ana',
        acceptedAnswers: ['Ana', 'Ako si Ana.'],
        correctWords: ['Ana'],
        autoChecked: true
      }
    },
    'G1-SUL-01': {
      prompt: 'Ako ay ____.',
      rubric: {
        gawainType: 'complete_sentence',
        template: 'Ako ay ____.',
        choices: ['masaya', 'lapis'],
        wordBank: ['masaya', 'lapis'],
        correctAnswer: 'masaya',
        acceptedAnswers: ['masaya', 'Ako ay masaya.'],
        correctWords: ['masaya'],
        autoChecked: true
      }
    },

    'G2-PAG-01': {
      prompt: 'Sina Nena at Kiko ay naglalaro sa ilalim ng ____.',
      rubric: {
        gawainType: 'complete_sentence',
        template: 'Sina Nena at Kiko ay naglalaro sa ilalim ng ____.',
        choices: ['puno', 'mesa'],
        wordBank: ['puno', 'mesa'],
        correctAnswer: 'puno',
        acceptedAnswers: ['puno', 'Sina Nena at Kiko ay naglalaro sa ilalim ng puno.'],
        correctWords: ['puno'],
        autoChecked: true
      }
    },
    'G2-WIK-01': {
      prompt: 'Ang salitang kilos sa pangungusap ay ____.',
      rubric: {
        gawainType: 'complete_sentence',
        template: 'Ang salitang kilos sa pangungusap ay ____.',
        choices: ['Nagbasa', 'Lira'],
        wordBank: ['Nagbasa', 'Lira'],
        correctAnswer: 'Nagbasa',
        acceptedAnswers: ['Nagbasa', 'Ang salitang kilos sa pangungusap ay Nagbasa.'],
        correctWords: ['Nagbasa'],
        autoChecked: true
      }
    },
    'G2-PAN-01': {
      prompt: 'Ang tula ay tungkol sa ____.',
      rubric: {
        gawainType: 'complete_sentence',
        template: 'Ang tula ay tungkol sa ____.',
        choices: ['pamilya', 'laruan'],
        wordBank: ['pamilya', 'laruan'],
        correctAnswer: 'pamilya',
        acceptedAnswers: ['pamilya', 'Ang tula ay tungkol sa pamilya.'],
        correctWords: ['pamilya'],
        autoChecked: true
      }
    },
    'G2-ORA-01': {
      prompt: 'Sa panuto, unang kukunin ang ____.',
      rubric: {
        gawainType: 'complete_sentence',
        template: 'Sa panuto, unang kukunin ang ____.',
        choices: ['lapis', 'bola'],
        wordBank: ['lapis', 'bola'],
        correctAnswer: 'lapis',
        acceptedAnswers: ['lapis', 'Sa panuto, unang kukunin ang lapis.'],
        correctWords: ['lapis'],
        autoChecked: true
      }
    },
    'G2-SUL-01': {
      prompt: 'Ako ay nagbabasa ng ____.',
      rubric: {
        gawainType: 'complete_sentence',
        template: 'Ako ay nagbabasa ng ____.',
        choices: ['aklat', 'sapatos'],
        wordBank: ['aklat', 'sapatos'],
        correctAnswer: 'aklat',
        acceptedAnswers: ['aklat', 'Ako ay nagbabasa ng aklat.'],
        correctWords: ['aklat'],
        autoChecked: true
      }
    },

    'G3-PAG-01': {
      prompt: 'Si Carlo ay tumulong sa ____.',
      rubric: {
        gawainType: 'complete_sentence',
        template: 'Si Carlo ay tumulong sa ____.',
        choices: ['kaklase', 'laruan'],
        wordBank: ['kaklase', 'laruan'],
        correctAnswer: 'kaklase',
        acceptedAnswers: ['kaklase', 'Si Carlo ay tumulong sa kaklase.'],
        correctWords: ['kaklase'],
        autoChecked: true
      }
    },
    'G3-WIK-01': {
      prompt: 'Ang batang laging gumagawa ng gawain ay ____.',
      rubric: {
        gawainType: 'complete_sentence',
        template: 'Ang batang laging gumagawa ng gawain ay ____.',
        choices: ['masipag', 'bilog'],
        wordBank: ['masipag', 'bilog'],
        correctAnswer: 'masipag',
        acceptedAnswers: ['masipag', 'Ang batang laging gumagawa ng gawain ay masipag.'],
        correctWords: ['masipag'],
        autoChecked: true
      }
    },
    'G3-PAN-01': {
      prompt: 'Mahalaga ang ____ sa pabula.',
      rubric: {
        gawainType: 'complete_sentence',
        template: 'Mahalaga ang ____ sa pabula.',
        choices: ['paghahanda', 'pagkalimot'],
        wordBank: ['paghahanda', 'pagkalimot'],
        correctAnswer: 'paghahanda',
        acceptedAnswers: ['paghahanda', 'Mahalaga ang paghahanda sa pabula.'],
        correctWords: ['paghahanda'],
        autoChecked: true
      }
    },
    'G3-ORA-01': {
      prompt: 'Ikuwento ang isang ____ karanasan.',
      rubric: {
        gawainType: 'complete_sentence',
        template: 'Ikuwento ang isang ____ karanasan.',
        choices: ['masaya', 'lapis'],
        wordBank: ['masaya', 'lapis'],
        correctAnswer: 'masaya',
        acceptedAnswers: ['masaya', 'Ikuwento ang isang masaya karanasan.'],
        correctWords: ['masaya'],
        autoChecked: true
      }
    },
    'G3-SUL-01': {
      prompt: 'Ang talata ay binubuo ng mga ____.',
      rubric: {
        gawainType: 'complete_sentence',
        template: 'Ang talata ay binubuo ng mga ____.',
        choices: ['pangungusap', 'sapatos'],
        wordBank: ['pangungusap', 'sapatos'],
        correctAnswer: 'pangungusap',
        acceptedAnswers: ['pangungusap', 'Ang talata ay binubuo ng mga pangungusap.'],
        correctWords: ['pangungusap'],
        autoChecked: true
      }
    }
  };

  function defaultGawainForLesson(lessonCode, body, grade) {
    if (defaultGawainMap[lessonCode]) {
      return defaultGawainMap[lessonCode];
    }

    return {
      prompt: body.writingPrompt || 'Sumulat ng maikling sagot tungkol sa aralin.',
      rubric: {
        gawainType: grade >= 5 ? 'reflection' : 'writing_task',
        needsTeacherReview: true,
        criteria: {
          clarity: 5,
          grammar: 5,
          effort: 5
        }
      }
    };
  }

  for (let grade = 1; grade <= 6; grade++) {
    for (const subject of subjects) {
      const body = lessonBody(subject, grade);
      const xpReward = 18 + grade * 4 + (subject === 'Pagsulat' ? 6 : subject === 'Oral Comm' ? 4 : 0);
      const lesson = await Lesson.create({
        lessonCode: `G${grade}-${codeFor(subject)}-01`,
        gradeLevel: grade,
        subject,
        title: body.title,
        duration: body.duration,
        xpReward,
        passage: body.passage,
        instructions: body.instructions,
        speechTarget: body.speechTarget,
        status: 'published'
      });

      const mcqActivity = await LessonActivity.create({ lessonId: lesson.id, type: 'mcq', title: 'Pagsusulit', sortOrder: 1 });
      const mcqQuestions = questionsForSeedLesson(body);

      for (let questionIndex = 0; questionIndex < mcqQuestions.length; questionIndex++) {
        const item = mcqQuestions[questionIndex];
        const q = await MCQQuestion.create({
          activityId: mcqActivity.id,
          question: item.question,
          sortOrder: questionIndex + 1
        });

        const options = Array.isArray(item.options) ? item.options : [];
        const correct = Number(item.correct || 0);

        for (let i = 0; i < options.length; i++) {
          await MCQOption.create({
            questionId: q.id,
            optionText: options[i],
            isCorrect: i === correct,
            sortOrder: i + 1
          });
        }
      }

      const writingActivity = await LessonActivity.create({ lessonId: lesson.id, type: 'writing', title: 'Gawain', sortOrder: 2 });
      const gawain = defaultGawainForLesson(`G${grade}-${codeFor(subject)}-01`, body, grade);
      await WritingTask.create({ activityId: writingActivity.id, prompt: gawain.prompt, rubricJson: gawain.rubric });

      const speechActivity = await LessonActivity.create({ lessonId: lesson.id, type: 'speech', title: 'Pagsasanay sa Pagbigkas', sortOrder: 3 });
      await SpeechTask.create({ activityId: speechActivity.id, targetText: body.speechTarget, promptJson: ['Basahin nang malinaw.', 'Ulitin kung kailangan.', 'I-save ang transcript.'] });
    }
  }

  const group = await Group.create({ name: 'Pangkat Bituin', description: 'Demo group task para sa pagbasa at pagsulat.', createdByTeacherId: teacher.id });
  for (const s of createdStudents.slice(0, 3)) await GroupMember.create({ groupId: group.id, studentId: s.id });
  await GroupTask.create({ groupId: group.id, title: 'Magbasa at Magbahagi', description: 'Basahin ang kuwento at magbahagi ng aral sa grupo.', xpReward: 12 });

  const firstBadge = await Badge.findOne({ where: { code: 'FIRST_LESSON' } });
  if (firstBadge) await StudentBadge.create({ studentId: createdStudents[0].id, badgeId: firstBadge.id });

  await AuditLog.create({ actorUserId: adminUser.id, action: 'system.seed', entityType: 'database', metadata: { note: 'Initial Tuklas Talino demo data loaded.' } });
}
