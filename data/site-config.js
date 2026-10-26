// Edición activa y contenido público de Kon Club.
// Para añadir una función: incluir su logo/flyer en public/media, registrar assets,
// completar editionDefaults, actualizar activeEdition y archiveCatalog.
// El editor visual del sitio es una vista previa local, NO publica cambios por sí mismo.
window.KON_CONFIG = {
  activeEdition: 'beavers',
  // Próxima edición anunciada por organización, con fecha, lugar, precio y afiche confirmados el 25/10/2026.
  // Anunciada en la home; todavía no forma parte del archivo histórico.
  plannedEditions: {beavers:{slug:"beavers",title:"HUNDREDS OF BEAVERS",director:"Mike Cheslik",year:2022,status:"announced",date:"2026-11-08T18:00:00-03:00",endsAt:"2026-11-08T23:00:00-03:00",venue:"Virrey Olaguer y Feliú 3121, Buenos Aires",price:9000,flyer:"public/media/beavers-2026-11-08.webp",ticket:null,zine:null,synopsis:"En un invierno del siglo XIX, Jean Kayak pierde su negocio de aguardiente de manzana y debe sobrevivir en un paisaje congelado. Para convertirse en un gran trampero tendrá que enfrentarse a una cantidad disparatada de castores y a situaciones cada vez más absurdas."}},
  assets: {"beavers":"public/media/beavers-2026-11-08.webp","beaversDraft":"public/media/beavers-draft-poster.svg","beaversDraftLogo":"public/media/kon-draft-wordmark.svg","logoHalloween2026":"public/media/8e47e9d7df2efb.png","halloween":"public/media/df27d971f6912f.webp","wag":"public/media/261621a14d0677.webp","flcl":"public/media/a9035079072fca.webp","paprika":"public/media/676e7dbee3b1fd.webp","nirvanna":"public/media/6e3aa330456735.webp","fear":"public/media/cd0711d82e4c5a.webp","logoHalloween":"public/media/6b17595351a746.webp","logoFlcl":"public/media/a2f5a47cad65e3.webp","logoFear":"public/media/15aaa0bd0f1b46.webp","fanPaprika":"public/media/ba13b417f50c25.webp","fanWag":"public/media/50c062fbb25f11.webp","photo1":"public/media/cd060e7cc6ea42.webp","photo2":"public/media/9538596401c866.webp","photo3":"public/media/c467296d2e54d5.webp","photo4":"public/media/b3210033e1e1a4.webp","photo5":"public/media/ea14fcc0808a6f.webp","logoWag":"public/media/ec37518d2b62df.webp","logoPaprika":"public/media/5bbbffc6e92a96.webp","chungking":"public/media/7d513c65e78a9b.webp","mindgame":"public/media/b41f992d173f06.webp","walter30":"public/media/f9088922f8e259.webp","whiplash":"public/media/72c8dd1bbd3fdb.webp","afterhours":"public/media/56047adf986ece.webp","scott":"public/media/4e17ad6c748c19.webp","fox":"public/media/d993f74f1c4251.webp","dynamite":"public/media/fb3a6171073622.webp","humanist":"public/media/7ed64e2b3f78d4.webp"},
  // Fotografías tomadas en ediciones del archivo oficial (#17+), no flyers ni reseñas.
  photoAlbum: [
    {"src":"public/media/fotos/whiplash-60.jpg","edition":28,"event":"WHIPLASH","description":"Foto original del encuentro de Whiplash"},
    {"src":"public/media/fotos/chungking-168.jpg","edition":32,"event":"CHUNGKING EXPRESS","description":"Foto original de Chungking Express"},
    {"src":"public/media/fotos/whiplash-45.jpg","edition":28,"event":"WHIPLASH","description":"Registro fotográfico de la función Whiplash"},
    {
      "src": "public/media/fotos/whiplash-31.jpg",
      "edition": 28,
      "event": "WHIPLASH",
      "description": "Público reunido durante Whiplash"
    },
    {
      "src": "public/media/cd060e7cc6ea42.webp",
      "edition": 29,
      "event": "FEAR AND LOATHING",
      "description": "Juegos y encuentro social"
    },
    {
      "src": "public/media/fotos/chungking-169.jpg",
      "edition": 32,
      "event": "CHUNGKING EXPRESS",
      "description": "Mesa de juegos y asistentes"
    },
    {
      "src": "public/media/fotos/flcl-proyeccion.jpg",
      "edition": 33,
      "event": "FLCL",
      "description": "Proyección compartida"
    },
    {
      "src": "public/media/fotos/whiplash-22.jpg",
      "edition": 28,
      "event": "WHIPLASH",
      "description": "Partida de Dungeons & Dragons"
    },
    {
      "src": "public/media/c467296d2e54d5.webp",
      "edition": 29,
      "event": "FEAR AND LOATHING",
      "description": "Asistentes en Kon Club"
    },
    {
      "src": "public/media/fotos/chungking-166.jpg",
      "edition": 32,
      "event": "CHUNGKING EXPRESS",
      "description": "Juegos de mesa durante el evento"
    },
    {
      "src": "public/media/fotos/whiplash-55.jpg",
      "edition": 28,
      "event": "WHIPLASH",
      "description": "Charla en el encuentro"
    },
    {
      "src": "public/media/b3210033e1e1a4.webp",
      "edition": 29,
      "event": "FEAR AND LOATHING",
      "description": "Una noche compartida"
    },
    {
      "src": "public/media/fotos/chungking-159.jpg",
      "edition": 32,
      "event": "CHUNGKING EXPRESS",
      "description": "Proyección y comunidad"
    },
    {
      "src": "public/media/fotos/whiplash-42.jpg",
      "edition": 28,
      "event": "WHIPLASH",
      "description": "Invitados durante la función"
    },
    {
      "src": "public/media/ea14fcc0808a6f.webp",
      "edition": 29,
      "event": "FEAR AND LOATHING",
      "description": "Público del Kon"
    },
    {
      "src": "public/media/fotos/chungking-163.jpg",
      "edition": 32,
      "event": "CHUNGKING EXPRESS",
      "description": "Recuerdos de la noche"
    }
  ],
  editionDefaults: {beavers:{tag:'PRÓXIMA FUNCIÓN / KON CLUB',title:'CIENTOS|DE CASTORES.',lead:'HUNDREDS OF BEAVERS · MIKE CHESLIK (2022)',date:'DOM. 08 NOVIEMBRE | 18:00 A 23:00 HS',place:'VIRREY OLAGUER Y FELIÚ 3121 | BUENOS AIRES',price:'$9.000',poster:'beavers',logo:'beaversDraftLogo',palette:{bg:'#18232a',on:'#f5f1e6',paper:'#e8ecea',ink:'#20333d',accent:'#bad9dc',secondary:'#e6c999'}},halloween:{tag:'HALLOWEEN / DOBLE FUNCIÓN',title:'EL KON|SE DISFRAZA.',lead:'LA CASA LOBO × THE ROCKY HORROR PICTURE SHOW',date:'DOM. 25 OCTUBRE | 17:00 A 23:00 HS',place:'VIRREY OLAGUER Y FELIÚ 3121 | BUENOS AIRES',price:'$9.000',poster:'halloween',logo:'logoHalloween2026',palette:{bg:'#230519',on:'#fff4e6',paper:'#f4dec4',ink:'#291021',accent:'#f26c37',secondary:'#d64350'}},wag:{tag:'KON CLUB RECOMIENDA',title:'CINE,|MENTIRAS Y TV.',lead:'WAG THE DOG',date:'DOM. 04 OCTUBRE | 18:00 A 23:00 HS',place:'VIRREY OLAGUER Y FELIÚ 3121 | BUENOS AIRES',price:'CONSULTAR',poster:'wag',logo:'logoWag',palette:{bg:'#081853',on:'#f6f1de',paper:'#f0e2c9',ink:'#102051',accent:'#eab0ad',secondary:'#d12c39'}},flcl:{tag:'KON CLUB / ANIME',title:'UN VIAJE|SIN FRENOS.',lead:'FLCL',date:'DOM. 30 AGOSTO | 18:00 A 23:00 HS',place:'VIRREY OLAGUER Y FELIÚ 3121 | BUENOS AIRES',price:'CONSULTAR',poster:'flcl',logo:'logoFlcl',palette:{bg:'#34132e',on:'#fff0d5',paper:'#f5e7c9',ink:'#32122f',accent:'#e97c37',secondary:'#d4476f'}},paprika:{tag:'KON CLUB / CINE',title:'SOÑÁ|DESPIERTO.',lead:'PAPRIKA',date:'SÁB. 03 ENERO | 20:00 A 01:00 HS',place:'MANUEL UGARTE 2789 | BUENOS AIRES',price:'CONSULTAR',poster:'paprika',logo:'logoPaprika',palette:{bg:'#872427',on:'#fff1d5',paper:'#fbe1b9',ink:'#661a20',accent:'#ff8c57',secondary:'#e43b40'}}},
  // Reseñas manuscritas aprobadas por edición (#17+). Vacío hasta recibir las fotos originales.
  // Formato futuro: "35": [{src:"public/media/resenas/35/archivo.webp", description:"Reseña del público"}].
  archiveReviews: {},
  // Numeración editorial desde Paprika (#1); no equivale a carpetas de Drive.
  // Paleta propia de cada ficha, inspirada en la identidad de su fanzine o en su preset oficial.
  // El fondo de Black Dynamite se oscurece ligeramente para conservar contraste legible.
  archiveThemes: {"17":{"bg":"#872427","on":"#fff1d5","paper":"#fbe1b9","ink":"#661a20","accent":"#ff8c57","secondary":"#e43b40"},"19":{"bg":"#773c76","on":"#fff0e8","paper":"#fff0e8","ink":"#773c76","accent":"#ffd49a","secondary":"#ffd49a"},"21":{"bg":"#9b361a","on":"#fff1cd","paper":"#fff1cd","ink":"#642712","accent":"#ffe0a3","secondary":"#ffe0a3"},"22":{"bg":"#a54b25","on":"#fff3d9","paper":"#fff3d9","ink":"#a54b25","accent":"#ffdfa5","secondary":"#ffdfa5"},"24":{"bg":"#42171d","on":"#fff2e6","paper":"#fff2e6","ink":"#42171d","accent":"#f3ac78","secondary":"#f3ac78"},"26":{"bg":"#103f78","on":"#f3e9de","paper":"#f3e9de","ink":"#103f78","accent":"#f4dfa9","secondary":"#f4dfa9"},"28":{"bg":"#8b481d","on":"#ffeed8","paper":"#ffeed8","ink":"#8b481d","accent":"#fbd480","secondary":"#fbd480"},"29":{"bg":"#32245e","on":"#fff2db","paper":"#fff2db","ink":"#32245e","accent":"#f5ba78","secondary":"#f5ba78"},"30":{"bg":"#266a59","on":"#fff1dc","paper":"#fff1dc","ink":"#266a59","accent":"#f6e4a8","secondary":"#f6e4a8"},"31":{"bg":"#f36e2b","on":"#301d30","paper":"#301d30","ink":"#f36e2b","accent":"#301d30","secondary":"#301d30"},"32":{"bg":"#345d43","on":"#f5f5cc","paper":"#f5f5cc","ink":"#345d43","accent":"#f6d48b","secondary":"#f6d48b"},"33":{"bg":"#34132e","on":"#fff0d5","paper":"#f5e7c9","ink":"#32122f","accent":"#e97c37","secondary":"#d4476f"},"34":{"bg":"#661e1d","on":"#fbe4d5","paper":"#fbe4d5","ink":"#661e1d","accent":"#fbd49c","secondary":"#fbd49c"},"35":{"bg":"#081853","on":"#f6f1de","paper":"#f0e2c9","ink":"#102051","accent":"#eab0ad","secondary":"#d12c39"},"36":{"bg":"#230519","on":"#fff4e6","paper":"#f4dec4","ink":"#291021","accent":"#f26c37","secondary":"#d64350"}},
  archiveEditionNumbers: {"17":1,"19":2,"21":3,"22":4,"24":5,"26":6,"28":7,"29":8,"30":9,"31":10,"32":11,"33":12,"34":13,"35":14,"36":15},
  // Piezas físicas originales: fuentes verificadas en Google Drive, no copias públicas optimizadas.
  archiveTickets: {"17":[{"name":"Paprika","id":"1JuBjlMljvTLRiH4hkGUplq7GXR6IMynD"}],"19":[{"name":"Humanist Vampire","id":"1y1xrIY3S0xFEKPEoOFAwrABxJ-vmxtsq"}],"21":[{"name":"Black Dynamite","id":"1byH0GpEb7ybkhgZ_of_raN5WDJmZGlZc"}],"22":[{"name":"Fantastic Mr. Fox","id":"1qY4NdB0_uQDP5ZHrUltvv9CTtUzs-Tkg"}],"24":[{"name":"Scott Pilgrim","id":"1sTFg5odR6hUxROSD7rRGb_OUzoSL7Hxj"}],"26":[{"name":"After Hours / Kon Club Lite","id":"14Ih-OerKehcMUJRkEgLCCZtlXSCzbOCI"}],"28":[{"name":"Whiplash","id":"16qZcnMq5C-85Edz0j8hhPjJ2hbbanB-g"}],"29":[{"name":"Fear and Loathing (post-película)","id":"1o48CjIUorFUOkGvJLj6b8s7yvgoamA0O"}],"30":[{"name":"Walter Mitty","id":"1awHLaoCnn7BId-pLp1f9fegoazQAsV3f"}],"31":[{"name":"Mind Game","src":"public/media/entradas/mind-game.webp"}],"32":[{"name":"Chungking Express","src":"public/media/entradas/chungking-express.webp"}],"33":[{"name":"FLCL / diseño 1","id":"10MxDKkm6nwrsSJJqxKvjmU0V721wloLc"},{"name":"FLCL / diseño 2","id":"1NSJQsY5n_twSW5D5K-buJ9UVXRsSpRLS"},{"name":"FLCL / diseño 3","id":"1ypOPXN2H2L-Y8EstNX6PyKLl0xZ6gEdi"},{"name":"FLCL / diseño 4","id":"1RqjzTvRK0LbCMXLX2DUGj5z-Id0rzRHF"},{"name":"FLCL / diseño 5","id":"1LSsKwN_NfiSn3msTkWJJdrfmDSurHjNk"}],"34":[{"name":"Nirvanna the Band","id":"1nc_aQQ1QhDhTFgU4DshPt_oidQPsefGt"}],"35":[{"name":"Wag the Dog","id":"1U2CVYgwLtw_rS24oYZFcOLON0vlN66NE"}],"36":[{"name":"Halloween / diseño C","id":"1KdOabfMe3f2gCvIE6gx--bnRbA_dExnM"},{"name":"Halloween / diseño R","id":"1Vn9G9K8euy9Wq5ny72WPs4Iw8FaAMaHB"}]},
  // Sinopsis originales, breves y sin spoilers, vinculadas al número de carpeta.
  archiveSynopses: {
    "17": [
      {
        "title": "PAPRIKA",
        "text": "Una tecnología experimental permite que los terapeutas entren en los sueños de sus pacientes. Cuando el dispositivo cae en manos equivocadas, el mundo de los sueños comienza a invadir la realidad y una misteriosa detective debe detener el caos."
      }
    ],
    "19": [
      {
        "title": "HUMANIST VAMPIRE SEEKING CONSENTING SUICIDAL PERSON",
        "text": "Sasha es una joven vampira incapaz de matar para alimentarse, algo que desespera a su familia. Cuando conoce a Paul, un adolescente que atraviesa un momento muy difícil, surge entre ellos una conexión inesperada."
      }
    ],
    "21": [
      {
        "title": "BLACK DYNAMITE",
        "text": "Después del asesinato de su hermano, un exagente de la CIA vuelve a las calles para encontrar a los responsables. Entre conspiraciones, kung-fu y diálogos imposibles, la investigación se convierte en una parodia desatada del cine blaxploitation."
      }
    ],
    "22": [
      {
        "title": "FANTASTIC MR. FOX",
        "text": "El señor Fox lleva una vida tranquila con su familia, aunque extraña sus viejas escapadas para robar comida. Cuando decide volver a las andadas, provoca la furia de tres granjeros y pone en riesgo a toda su comunidad."
      }
    ],
    "24": [
      {
        "title": "SCOTT PILGRIM VS. THE WORLD",
        "text": "Scott conoce a Ramona y se enamora de inmediato, pero salir con ella tiene una condición inesperada: deberá enfrentarse a sus siete ex malvados. Romance, música y peleas con lógica de videojuego en una comedia sin respiro."
      }
    ],
    "26": [
      {
        "title": "AFTER HOURS",
        "text": "Una salida aparentemente inocente lleva a Paul, un oficinista neoyorquino, al Soho de madrugada. A partir de ahí, cada intento de volver a su casa lo mete en una cadena más absurda y desesperante de malentendidos."
      }
    ],
    "28": [
      {
        "title": "WHIPLASH",
        "text": "Andrew sueña con convertirse en un baterista de jazz extraordinario. Cuando entra en la banda de un profesor tan brillante como despiadado, la búsqueda de la excelencia empieza a confundirse con una obsesión peligrosa."
      }
    ],
    "29": [
      {
        "title": "FEAR AND LOATHING IN LAS VEGAS",
        "text": "Un periodista y su abogado viajan a Las Vegas para cubrir un evento, pero el encargo se convierte en una odisea de drogas, paranoia y encuentros insólitos. Una búsqueda delirante del sueño americano que se desarma a cada kilómetro."
      }
    ],
    "30": [
      {
        "title": "THE SECRET LIFE OF WALTER MITTY",
        "text": "Walter trabaja entre fotografías y se refugia en fantasías de grandes aventuras. Cuando una imagen clave desaparece, tendrá que dejar de soñar despierto y lanzarse a un viaje real que lo llevará mucho más lejos de lo que imaginaba."
      }
    ],
    "31": [
      {
        "title": "MIND GAME",
        "text": "Tras un encuentro fatal con la yakuza, Nishi se niega a aceptar su destino y consigue volver a la vida. Lo que sigue es una aventura animada desbordada de imaginación, en la que cada giro abre una nueva posibilidad."
      }
    ],
    "32": [
      {
        "title": "CHUNGKING EXPRESS",
        "text": "En el Hong Kong de los noventa, dos policías intentan superar sus rupturas amorosas mientras se cruzan con mujeres que alteran sus rutinas. Dos historias de encuentros fugaces, soledad y romance entre luces de neón y calles abarrotadas."
      }
    ],
    "33": [
      {
        "title": "FLCL",
        "text": "Naota lleva una vida bastante aburrida hasta que una misteriosa mujer en Vespa irrumpe en su pueblo. De pronto aparecen robots, guitarras y situaciones imposibles en una historia frenética sobre crecer y no entender demasiado qué está pasando."
      }
    ],
    "34": [
      {
        "title": "NIRVANNA THE BAND THE SHOW THE MOVIE",
        "text": "Matt y Jay llevan años intentando conseguir un recital en el mítico Rivoli de Toronto, siempre con planes cada vez más absurdos. Cuando uno de esos intentos sale terriblemente mal, los dos terminan viajando por accidente al año 2008."
      }
    ],
    "35": [
      {
        "title": "WAG THE DOG",
        "text": "A días de las elecciones, un escándalo amenaza con hundir al presidente de Estados Unidos. Para desviar la atención, un asesor político y un productor de Hollywood deciden inventar una guerra y convertirla en el espectáculo perfecto."
      }
    ],
    "36": [
      {
        "title": "LA CASA LOBO",
        "text": "María escapa de una colonia alemana en el sur de Chile y se refugia en una casa que parece tener vida propia. Las paredes, los objetos y sus miedos se transforman en una pesadilla animada tan inquietante como hipnótica."
      },
      {
        "title": "THE ROCKY HORROR PICTURE SHOW",
        "text": "Una pareja queda varada en medio de una tormenta y busca ayuda en un castillo habitado por personajes extravagantes. Allí los espera el doctor Frank-N-Furter y una noche de música, ciencia ficción y excesos que rompe todas las reglas."
      }
    ]
  },
  archiveCatalog: [["36","ROCKY HORROR & LA CASA LOBO","halloween"],["35","WAG THE DOG","wag"],["34","NIRVANNA THE BAND","nirvanna"],["33","FLCL","flcl"],["32","CHUNGKING EXPRESS","chungking"],["31","MIND GAME","mindgame"],["30","THE SECRET LIFE OF WALTER MITTY","walter30"],["29","FEAR AND LOATHING IN LAS VEGAS","fear"],["28","WHIPLASH","whiplash"],["26","AFTER HOURS","afterhours"],["24","SCOTT PILGRIM VS. THE WORLD","scott"],["22","FANTASTIC MR. FOX","fox"],["21","BLACK DYNAMITE","dynamite"],["19","HUMANIST VAMPIRE","humanist"],["17","PAPRIKA","paprika"]],
  readerIssues: {"halloween":{"number":"15","name":"HALLOWEEN · LA CASA LOBO × ROCKY HORROR","bg":"#230519","on":"#fff4e6","folder":"36","print":"public/media/fanzines/halloween-15-pliego-v2.jpg","pages":["public/media/fanzines/halloween-15-p01.webp","public/media/fanzines/halloween-15-p02.webp","public/media/fanzines/halloween-15-p03.webp","public/media/fanzines/halloween-15-p04-v2.webp","public/media/fanzines/halloween-15-p05.webp","public/media/fanzines/halloween-15-p06.webp","public/media/fanzines/halloween-15-p07.webp","public/media/fanzines/halloween-15-p08.webp"]},"wag-the-dog":{"number":"14","name":"WAG THE DOG","bg":"#182b55","on":"#fff3dc","folder":"35","print":"public/media/acb8a1863dce19.jpg","pages":["public/media/60e76ac09646a8.webp","public/media/261ac026984d5c.webp","public/media/eab90ccd43ed96.webp","public/media/faa22a10a5d3fa.webp","public/media/580370faa07b1c.webp","public/media/2d224d1f172d6a.webp","public/media/e926524388604c.webp","public/media/45f75be206318d.webp"]},"nirvanna-the-band":{"number":"13","name":"NIRVANNA THE BAND","bg":"#661e1d","on":"#fbe4d5","folder":"34","print":"public/media/1f7f4573d06cfa.jpg","pages":["public/media/fb1b1c77fe586a.webp","public/media/54534bbb5de6fa.webp","public/media/8948d417eb2da5.webp","public/media/a323edc40931f2.webp","public/media/560f9ca06a291c.webp","public/media/29857f463c1af3.webp","public/media/b66cb843855dde.webp","public/media/63d3eb9a631b76.webp"]},"flcl":{"number":"12","name":"FLCL","bg":"#ba3b59","on":"#fff1e9","folder":"33","print":"public/media/37bfb733fe79d6.jpg","pages":["public/media/7bd35c83c2e798.webp","public/media/935aa4e9995d5a.webp","public/media/616829dbca6bc4.webp","public/media/83d985ca2e92cc.webp","public/media/968b751ad02293.webp","public/media/8063fe58c639ea.webp","public/media/f06f1a505de180.webp","public/media/936ddcd647854b.webp"]},"chungking-express":{"number":"11","name":"CHUNGKING EXPRESS","bg":"#345d43","on":"#f5f5cc","folder":"32","print":"public/media/bae0e88e717ba1.jpg","pages":["public/media/a43d55992b1a71.webp","public/media/70bc3af1039048.webp","public/media/577b7dc1bb0e4e.webp","public/media/b5a065cd7a864d.webp","public/media/68bfcc7d0d646c.webp","public/media/1d8b52313ec9c2.webp","public/media/9ab6491a0d4cc7.webp","public/media/395ead0645c0c4.webp"]},"mind-game":{"number":"10","name":"MIND GAME","bg":"#f36e2b","on":"#301d30","folder":"31","print":"public/media/ccd891dd2fe863.jpg","pages":["public/media/a6d8324de1f8c3.webp","public/media/7171d0c2428d10.webp","public/media/0bd0b0b7d401da.webp","public/media/85ec3d2af1ec2f.webp","public/media/4bdc283a3e07dc.webp","public/media/f120ac0d366c79.webp","public/media/1c622258d0de6b.webp","public/media/d1d9aeb5ba46fe.webp"]},"walter-mitty":{"number":"09","name":"THE SECRET LIFE OF WALTER MITTY","bg":"#266a59","on":"#fff1dc","folder":"30","print":"public/media/0425472b29f93f.jpg","pages":["public/media/d8676f80460a6d.webp","public/media/26c88f27b1fb17.webp","public/media/1831a2b86c6519.webp","public/media/c2bb6d3cd88dca.webp","public/media/aed327105817c5.webp","public/media/55ca8af5fcc06f.webp","public/media/14bb66688538b1.webp","public/media/1606ab83ef9f96.webp"]},"fear-and-loathing":{"number":"08","name":"FEAR AND LOATHING","bg":"#32245e","on":"#fff2db","folder":"29","print":"public/media/56aa45ad8bddac.jpg","pages":["public/media/40b60170a2cb92.webp","public/media/ddfa541ff93617.webp","public/media/06b2a0b13c1567.webp","public/media/ac2dc8781d59e7.webp","public/media/3e717932480034.webp","public/media/d3a3650cce0920.webp","public/media/6af3f54e4ab1a6.webp","public/media/2a6fb12fbc163f.webp"]},"whiplash":{"number":"07","name":"WHIPLASH","bg":"#8b481d","on":"#ffeed8","folder":"28","print":"public/media/802a4129d3667f.jpg","pages":["public/media/52d134741a877f.webp","public/media/292dddae037d00.webp","public/media/db94d9fb61e1d3.webp","public/media/9119dbf34fb003.webp","public/media/c290ce38360340.webp","public/media/1a7ceb62266ad9.webp","public/media/3989d30f350cbf.webp","public/media/3c6e5a97fb9652.webp"]},"after-hours":{"number":"06","name":"AFTER HOURS","bg":"#103f78","on":"#f3e9de","folder":"26","print":"public/media/9ee55dc7509d25.jpg","pages":["public/media/fd448bf5fefd01.webp","public/media/84533405dd74fc.webp","public/media/ab90224061c3ff.webp","public/media/90703f01564fbd.webp","public/media/36de3249720e76.webp","public/media/2bb915f45709fb.webp","public/media/a11bab31a1d702.webp","public/media/0d8ee68dce42c5.webp"]},"scott-pilgrim":{"number":"05","name":"SCOTT PILGRIM","bg":"#42171d","on":"#fff2e6","folder":"24","print":"public/media/2bad00547ff4e4.jpg","pages":["public/media/daa5ac15f013d8.webp","public/media/ef03cffbfb3880.webp","public/media/a9b55dff47ac0d.webp","public/media/b9671f8711d5f6.webp","public/media/b954c8dcba0509.webp","public/media/13a36b590a6117.webp","public/media/9e300e665feada.webp","public/media/b33c1f7bdd5f3f.webp"]},"fantastic-mr-fox":{"number":"04","name":"FANTASTIC MR. FOX","bg":"#a54b25","on":"#fff3d9","folder":"22","print":"public/media/b08b9482e0eabd.jpg","pages":["public/media/9fc4720b7d2ed3.webp","public/media/8ddcc6b47a97e3.webp","public/media/43bed08d3cae8c.webp","public/media/5e4957fca1c9ff.webp","public/media/58462167805440.webp","public/media/5f7efb8f522fb3.webp","public/media/4d9401172b1d20.webp","public/media/77a23bb5613b27.webp"]},"black-dynamite":{"number":"03","name":"BLACK DYNAMITE","bg":"#dd5623","on":"#fff1cd","folder":"21","print":"public/media/091cc3209d5bae.jpg","pages":["public/media/674cbfb79eb796.webp","public/media/68174b1b192e42.webp","public/media/8878566c8674a2.webp","public/media/9ec5c2edb1b950.webp","public/media/4d19bddafa35ca.webp","public/media/d9c32f1f6d9da6.webp","public/media/287087932002ee.webp","public/media/8397e4895de6a6.webp"]},"humanist-vampire":{"number":"02","name":"HUMANIST VAMPIRE","bg":"#773c76","on":"#fff0e8","folder":"19","print":"public/media/70124f2cca8f6b.jpg","pages":["public/media/5e6dbb4ba4eb00.webp","public/media/a091b12f9812a2.webp","public/media/33cb7b265aa314.webp","public/media/4f3d4f2fa98c62.webp","public/media/c98f98c04ca58c.webp","public/media/bd8c2d66e56b13.webp","public/media/cd3be6eab0f46e.webp","public/media/733379585eae62.webp"]},"paprika":{"number":"01","name":"PAPRIKA","bg":"#e4bc86","on":"#762623","folder":"17","print":"public/media/1303fee15960ec.jpg","pages":["public/media/da52b1117c6c4e.webp","public/media/256d90d8615670.webp","public/media/1b72f8c3262f3d.webp","public/media/bf7266e26f5b90.webp","public/media/ec522675af4689.webp","public/media/732790cf22c6c7.webp","public/media/32045f36746cc7.webp","public/media/9b34f2113bdda6.webp"]}}
};
