/* ============================================================
   TripReel — turn a Google Takeout Timeline export into a
   shareable travel video. 100% client-side, no uploads.
   Built by Dev Parth · © 2026 Dev Parth (MIT License — see LICENSE)
   ============================================================ */
'use strict';

/* ================= i18n ================= */
const I18N = {
  en: {
    'tagline': 'Turn your Google Timeline into a travel video',
    'privacy.badge': '100% on-device',
    'tab.create': 'Create', 'tab.videos': 'My videos', 'tab.settings': 'Settings',
    'step.import': 'Import', 'step.dates': 'Dates', 'step.preview': 'Preview',
    'help.title': 'How do I get my Timeline file?',
    'help.s1': 'Location history must have been on while you travelled (Google app → Settings → Location history).',
    'help.s2': 'Open takeout.google.com in a browser and sign in to your Google account.',
    'help.s3': 'Untick everything, then expand “Location history” and tick “Timeline”.',
    'help.s4': 'Set the time range (e.g. your trip), keep the format “Timeline (JSON)” and press “Create export”.',
    'help.s5': 'A few minutes later Google e-mails you a download link — download the .zip file.',
    'help.s6': 'Come back here, tap “Choose file” and pick the .zip (or the timeline.json inside it).',
    'help.privacyHead': 'Your privacy:',
    'help.privacyBody': 'everything is processed on your phone. Nothing is ever uploaded.',
    'import.head': 'Load your Timeline',
    'import.desc': 'Pick the .json or .zip from your Google Takeout export. It stays on your device.',
    'import.choose': 'Choose file',
    'import.chooseSub': 'Timeline.json or the Takeout .zip',
    'import.sample': 'Try the sample trip',
    'import.sampleHint': 'No file handy? Explore the app with a Delhi → Agra demo trip.',
    'parsed.head': 'Your trip is loaded',
    'parsed.change': 'Choose another file',
    'common.back': 'Back', 'common.next': 'Continue', 'common.close': 'Close', 'common.cancel': 'Cancel', 'common.delete': 'Delete',
    'dates.head': 'Pick your trip dates',
    'dates.desc': 'Select the start and end date of the video.',
    'dates.from': 'From', 'dates.to': 'To',
    'dates.all': 'Whole trip', 'dates.first': 'First day', 'dates.last': 'Last day',
    'preview.title': 'Video title',
    'preview.record': 'Create video',
    'preview.recordHint': 'The video is rendered on your phone — nothing is uploaded.',
    'videos.title': 'My videos',
    'videos.import': 'Add video',
    'videos.empty': 'No videos yet',
    'videos.emptyHint': 'Create your first travel video, or add an MP4 you already have.',
    'videos.share': 'Share', 'videos.save': 'Save', 'videos.delete': 'Delete',
    'export.tip': 'Keep this screen open while your video is rendered.',
    'export.preparing': 'Preparing…',
    'export.tiles': 'Loading map tiles…',
    'export.rendering': 'Rendering your journey…',
    'export.recording': 'Recording in real time…',
    'export.finalizing': 'Finalizing file…',
    'settings.videoHead': 'Video defaults',
    'settings.size': 'Video size',
    'settings.sizeDesc': 'Vertical is best for phone sharing; landscape for YouTube.',
    'settings.camera': 'Camera movement',
    'settings.speed': 'Animation speed',
    'settings.mapStyle': 'Map style',
    'settings.showInfo': 'Show date & distance',
    'settings.endZoom': 'Zoomed-out ending view',
    'size.portrait': 'Vertical · 720×1280', 'size.portraitHd': 'Vertical HD · 1080×1920',
    'size.landscape': 'Landscape · 1280×720', 'size.square': 'Square · 1080×1080',
    'cam.follow': 'Follow (smooth chase)', 'cam.cinematic': 'Cinematic (slow & wide)', 'cam.overview': 'Fixed overview',
    'speed.slow': 'Slow', 'speed.normal': 'Normal', 'speed.fast': 'Fast',
    'map.standard': 'Standard (streets)', 'map.dark': 'Dark', 'map.clean': 'Simple (works offline)',
    'settings.langHead': 'Language', 'settings.language': 'App language',
    'settings.privacyHead': 'Privacy',
    'settings.privacyBody': 'TripReel runs entirely in your browser. Your location data is never uploaded anywhere. The only network requests are for map tiles (roads and place names) — they never contain your positions.',
    'settings.attrib': 'Map data © OpenStreetMap contributors · Dark tiles © CARTO',
    'settings.dataHead': 'App data',
    'settings.dataBody': 'Videos and settings are stored only on this device (browser storage).',
    'settings.wipe': 'Delete all app data',
    'toast.saved': 'Video saved to your library',
    'toast.imported': 'Video added',
    'toast.deleted': 'Video deleted',
    'toast.badFile': 'Couldn’t read that file. Pick a Timeline.json or the Takeout .zip.',
    'toast.noPoints': 'No location points found in that range. Try a wider range.',
    'toast.videoErr': 'Video creation isn’t supported by this browser. Try Chrome, or update your browser.',
    'toast.wiped': 'App data deleted',
    'toast.vp9note': 'Note: this device can’t encode H.264 — the video uses VP9 and may not play on iPhone.',
    'toast.sessionOnly': 'Private mode: videos will only live in this session.',
    'trip.summary': '{n} points · {from} to {to}',
    'range.summary': '{n} points · {km} km in range',
    'preview.meta': '{km} km · {days} · {pts} points',
    'end.trip': 'Trip',
    'end.madeWith': 'Made with TripReel · by Dev Parth',
    'days.one': '1 day', 'days.many': '{n} days',
    'confirm.videoTitle': 'Delete this video?',
    'confirm.videoBody': 'This can’t be undone.',
    'confirm.wipeTitle': 'Delete everything?',
    'confirm.wipeBody': 'All your videos, settings and the loaded trip will be removed from this device.',
    'vmeta': '{date} · {size} MB · {dur}'
  },
  hi: {
    'tagline': 'अपना Google Timeline ट्रैवल वीडियो में बदलें',
    'privacy.badge': '100% डीवाइस पर',
    'tab.create': 'बनाएँ', 'tab.videos': 'मेरी वीडियो', 'tab.settings': 'सेटिंग्स',
    'step.import': 'फ़ाइल', 'step.dates': 'तारीख़ें', 'step.preview': 'प्रीव्यू',
    'help.title': 'Timeline फ़ाइल कैसे पाएँ?',
    'help.s1': 'सफ़र के दौरान फ़ोन में Location history चालू होनी चाहिए (Google ऐप → Settings → Location history)।',
    'help.s2': 'takeout.google.com खोलें और Google खाते में साइन इन करें।',
    'help.s3': 'सब कुछ untick करें, फिर “Location history” खोलकर “Timeline” चुनें।',
    'help.s4': 'समय रेंज (जैसे आपका ट्रिप) दें, format “Timeline (JSON)” ही रखें, फिर “Create export” दबाएँ।',
    'help.s5': 'कुछ मिनट बाद Google डाउनलोड लिंक मेल करेगा — .zip फ़ाइल डाउनलोड करें।',
    'help.s6': 'वापस यहाँ आकर “Choose file” दबाएँ और .zip (या उसमें की timeline.json) चुनें।',
    'help.privacyHead': 'आपकी निजता:',
    'help.privacyBody': 'सब कुछ आपके फ़ोन पर ही बनता है। कुछ भी upload नहीं होता।',
    'import.head': 'अपनी Timeline लोड करें',
    'import.desc': 'Google Takeout export की .json या .zip चुनें। यह आपके डिवाइस पर ही रहती है।',
    'import.choose': 'फ़ाइल चुनेँ',
    'import.chooseSub': 'Timeline.json या Takeout .zip',
    'import.sample': 'नमूना ट्रिप आज़माएँ',
    'import.sampleHint': 'फ़ाइल नहीं है? दिल्ली → आगरा डेमो ट्रिप से देखें।',
    'parsed.head': 'आपका ट्रिप लोड हो गया',
    'parsed.change': 'दूसरी फ़ाइल चुनें',
    'common.back': 'वापस', 'common.next': 'आगे बढ़ें', 'common.close': 'बंद करें', 'common.cancel': 'रद्द करें', 'common.delete': 'हटाएँ',
    'dates.head': 'अपनी ट्रिप की तारीख़ें चुनें',
    'dates.desc': 'वीडियो की शुरूआत और अंत की तारीख़ चुनें।',
    'dates.from': 'से', 'dates.to': 'तक',
    'dates.all': 'पूरा ट्रिप', 'dates.first': 'पहला दिन', 'dates.last': 'आख़िरी दिन',
    'preview.title': 'वीडियो का शीर्षक',
    'preview.record': 'वीडियो बनाएँ',
    'preview.recordHint': 'वीडियो आपके फ़ोन पर बनता है — कुछ भी upload नहीं होता।',
    'videos.title': 'मेरी वीडियो',
    'videos.import': 'वीडियो जोड़ें',
    'videos.empty': 'अभी कोई वीडियो नहीं',
    'videos.emptyHint': 'पहला ट्रैवल वीडियो बनाएँ, या पुराना MP4 जोड़ें।',
    'videos.share': 'शेयर', 'videos.save': 'सेव', 'videos.delete': 'हटाएँ',
    'export.tip': 'वीडियो बनते समय यह स्क्रीन खुली रखें।',
    'export.preparing': 'तैयारी हो रही है…',
    'export.tiles': 'नक्शे की tiles load हो रही हैं…',
    'export.rendering': 'आपका सफ़र render हो रहा है…',
    'export.recording': 'रिकॉर्डिंग (real time) हो रही है…',
    'export.finalizing': 'फ़ाइल तैयार हो रही है…',
    'settings.videoHead': 'वीडियो डिफ़ॉल्ट',
    'settings.size': 'वीडियो का आकार',
    'settings.sizeDesc': 'फ़ोन शेयरिंग के लिए vertical सर्वोत्तम; YouTube के लिए landscape।',
    'settings.camera': 'कैमरा मूवमेंट',
    'settings.speed': 'एनिमेशन गति',
    'settings.mapStyle': 'नक्शा स्टाइल',
    'settings.showInfo': 'तारीख़ व दूरी दिखाएँ',
    'settings.endZoom': 'zoomed-out एंडिंग व्यू',
    'size.portrait': 'Vertical · 720×1280', 'size.portraitHd': 'Vertical HD · 1080×1920',
    'size.landscape': 'Landscape · 1280×720', 'size.square': 'Square · 1080×1080',
    'cam.follow': 'Follow (smooth chase)', 'cam.cinematic': 'Cinematic (धीमा व wide)', 'cam.overview': 'Fixed overview',
    'speed.slow': 'धीमा', 'speed.normal': 'सामान्य', 'speed.fast': 'तेज़',
    'map.standard': 'Standard (सड़कें)', 'map.dark': 'Dark', 'map.clean': 'Simple (ऑफ़लाइन चलता है)',
    'settings.langHead': 'भाषा', 'settings.language': 'ऐप की भाषा',
    'settings.privacyHead': 'निजता',
    'settings.privacyBody': 'TripReel पूरी तरह आपके ब्राउज़र में चलता है। आपकी location data कहीं upload नहीं होती। केवल map tiles (सड़कें, नाम) के लिए network request जाता है — उनमें आपका position नहीं होता।',
    'settings.attrib': 'Map data © OpenStreetMap contributors · Dark tiles © CARTO',
    'settings.dataHead': 'ऐप डेटा',
    'settings.dataBody': 'वीडियो और सेटिंग्स केवल इस डिवाइस पर (browser storage) सेव होती हैं।',
    'settings.wipe': 'सारा ऐप डेटा हटाएँ',
    'toast.saved': 'वीडियो आपके library में सेव हो गया',
    'toast.imported': 'वीडियो जुड़ गई',
    'toast.deleted': 'वीडियो हट गई',
    'toast.badFile': 'यह फ़ाइल पढ़ी नहीं जा सकी। Timeline.json या Takeout .zip चुनें।',
    'toast.noPoints': 'इस रेंज में कोई location points नहीं मिले। बड़ी रेंज आज़माएँ।',
    'toast.videoErr': 'इस ब्राउज़र पर वीडियो नहीं बना सका। Chrome आज़माएँ या ब्राउज़र अपडेट करें।',
    'toast.wiped': 'ऐप डेटा हटा दिया गया',
    'toast.vp9note': 'नोट: इस डिवाइस पर H.264 encoding नहीं है — वीडियो VP9 में है, iPhone पर play नहीं हो सकती।',
    'toast.sessionOnly': 'Private mode: वीडियो केवल इस session में रहेगी।',
    'trip.summary': '{n} points · {from} से {to}',
    'range.summary': '{n} points · range में {km} km',
    'preview.meta': '{km} km · {days} · {pts} points',
    'end.trip': 'ट्रिप',
    'end.madeWith': 'Dev Parth के TripReel से बना',
    'days.one': '1 दिन', 'days.many': '{n} दिन',
    'confirm.videoTitle': 'यह वीडियो हटाएँ?',
    'confirm.videoBody': 'यह वापस नहीं हो सकता।',
    'confirm.wipeTitle': 'सब हटाएँ?',
    'confirm.wipeBody': 'सभी वीडियो, सेटिंग्स और लोडे़ड ट्रिप इस डिवाइस से हट जाएँगे।',
    'vmeta': '{date} · {size} MB · {dur}'
  },
  es: {
    'tagline': 'Convierte tu Timeline de Google en un video de viaje',
    'privacy.badge': '100% en tu dispositivo',
    'tab.create': 'Crear', 'tab.videos': 'Mis videos', 'tab.settings': 'Ajustes',
    'step.import': 'Archivo', 'step.dates': 'Fechas', 'step.preview': 'Vista previa',
    'help.title': '¿Cómo obtengo mi archivo Timeline?',
    'help.s1': 'El historial de ubicación debe haber estado activado durante tu viaje (app de Google → Ajustes → Historial de ubicación).',
    'help.s2': 'Abre takeout.google.com e inicia sesión en tu cuenta de Google.',
    'help.s3': 'Deselecciona todo, expande «Historial de ubicación» y marca «Timeline».',
    'help.s4': 'Elige el rango de fechas (tu viaje), deja el formato «Timeline (JSON)» y pulsa «Crear la exportación».',
    'help.s5': 'Minutos después Google te enviará un enlace por correo: descarga el .zip.',
    'help.s6': 'Vuelve aquí, pulsa «Elegir archivo» y elige el .zip (o el timeline.json que contiene).',
    'help.privacyHead': 'Tu privacidad:',
    'help.privacyBody': 'todo se procesa en tu teléfono. Nada se sube nunca.',
    'import.head': 'Carga tu Timeline',
    'import.desc': 'Elige el .json o .zip de tu exportación de Google Takeout. Se queda en tu dispositivo.',
    'import.choose': 'Elegir archivo',
    'import.chooseSub': 'Timeline.json o el .zip de Takeout',
    'import.sample': 'Probar el viaje de ejemplo',
    'import.sampleHint': '¿Sin archivo? Prueba con el viaje demo Delhi → Agra.',
    'parsed.head': 'Tu viaje está cargado',
    'parsed.change': 'Elegir otro archivo',
    'common.back': 'Atrás', 'common.next': 'Continuar', 'common.close': 'Cerrar', 'common.cancel': 'Cancelar', 'common.delete': 'Eliminar',
    'dates.head': 'Elige las fechas de tu viaje',
    'dates.desc': 'Selecciona la fecha de inicio y fin del video.',
    'dates.from': 'Desde', 'dates.to': 'Hasta',
    'dates.all': 'Todo el viaje', 'dates.first': 'Primer día', 'dates.last': 'Último día',
    'preview.title': 'Título del video',
    'preview.record': 'Crear video',
    'preview.recordHint': 'El video se genera en tu teléfono; nada se sube.',
    'videos.title': 'Mis videos',
    'videos.import': 'Añadir video',
    'videos.empty': 'Aún no hay videos',
    'videos.emptyHint': 'Crea tu primer video de viaje o añade un MP4 que ya tengas.',
    'videos.share': 'Compartir', 'videos.save': 'Guardar', 'videos.delete': 'Eliminar',
    'export.tip': 'Mantén esta pantalla abierta mientras se genera tu video.',
    'export.preparing': 'Preparando…',
    'export.tiles': 'Cargando mapas…',
    'export.rendering': 'Renderizando tu viaje…',
    'export.recording': 'Grabando en tiempo real…',
    'export.finalizing': 'Finalizando el archivo…',
    'settings.videoHead': 'Ajustes de video',
    'settings.size': 'Tamaño del video',
    'settings.sizeDesc': 'Vertical es ideal para compartir en el móvil; horizontal para YouTube.',
    'settings.camera': 'Movimiento de cámara',
    'settings.speed': 'Velocidad de animación',
    'settings.mapStyle': 'Estilo del mapa',
    'settings.showInfo': 'Mostrar fecha y distancia',
    'settings.endZoom': 'Final con zoom amplio',
    'size.portrait': 'Vertical · 720×1280', 'size.portraitHd': 'Vertical HD · 1080×1920',
    'size.landscape': 'Horizontal · 1280×720', 'size.square': 'Cuadrado · 1080×1080',
    'cam.follow': 'Seguir (suave)', 'cam.cinematic': 'Cinemático (lento y amplio)', 'cam.overview': 'Vista fija',
    'speed.slow': 'Lenta', 'speed.normal': 'Normal', 'speed.fast': 'Rápida',
    'map.standard': 'Estándar (calles)', 'map.dark': 'Oscuro', 'map.clean': 'Simple (sin conexión)',
    'settings.langHead': 'Idioma', 'settings.language': 'Idioma de la app',
    'settings.privacyHead': 'Privacidad',
    'settings.privacyBody': 'TripReel funciona por completo en tu navegador. Tus datos de ubicación nunca se suben a ningún sitio. Las únicas peticiones de red son para las fichas del mapa (calles y nombres) y nunca contienen tus posiciones.',
    'settings.attrib': 'Map data © OpenStreetMap contributors · Dark tiles © CARTO',
    'settings.dataHead': 'Datos de la app',
    'settings.dataBody': 'Los videos y ajustes se guardan solo en este dispositivo (almacenamiento del navegador).',
    'settings.wipe': 'Borrar todos los datos',
    'toast.saved': 'Video guardado en tu biblioteca',
    'toast.imported': 'Video añadido',
    'toast.deleted': 'Video eliminado',
    'toast.badFile': 'No se pudo leer ese archivo. Elige un Timeline.json o el .zip de Takeout.',
    'toast.noPoints': 'No hay puntos en ese rango. Prueba un rango mayor.',
    'toast.videoErr': 'No se pudo crear el video en este navegador. Prueba con Chrome o actualiza tu navegador.',
    'toast.wiped': 'Datos eliminados',
    'toast.vp9note': 'Nota: este dispositivo no codifica H.264; el video usa VP9 y puede no reproducirse en iPhone.',
    'toast.sessionOnly': 'Modo privado: los videos solo vivirán en esta sesión.',
    'trip.summary': '{n} puntos · de {from} a {to}',
    'range.summary': '{n} puntos · {km} km en el rango',
    'preview.meta': '{km} km · {days} · {pts} puntos',
    'end.trip': 'Viaje',
    'end.madeWith': 'Hecho con TripReel · por Dev Parth',
    'days.one': '1 día', 'days.many': '{n} días',
    'confirm.videoTitle': '¿Eliminar este video?',
    'confirm.videoBody': 'No se puede deshacer.',
    'confirm.wipeTitle': '¿Borrar todo?',
    'confirm.wipeBody': 'Se eliminarán todos los videos, ajustes y el viaje cargado de este dispositivo.',
    'vmeta': '{date} · {size} MB · {dur}'
  },
  fr: {
    'tagline': 'Transformez votre Google Timeline en vidéo de voyage',
    'privacy.badge': '100 % sur l’appareil',
    'tab.create': 'Créer', 'tab.videos': 'Mes vidéos', 'tab.settings': 'Réglages',
    'step.import': 'Fichier', 'step.dates': 'Dates', 'step.preview': 'Aperçu',
    'help.title': 'Comment obtenir mon fichier Timeline ?',
    'help.s1': 'L’historique de localisation doit avoir été activé pendant votre voyage (appli Google → Paramètres → Historique de localisation).',
    'help.s2': 'Ouvrez takeout.google.com et connectez-vous à votre compte Google.',
    'help.s3': 'Désélectionnez tout, dépliez « Historique de localisation » et cochez « Timeline ».',
    'help.s4': 'Choisissez la période (votre voyage), gardez le format « Timeline (JSON) » puis « Créer l’export ».',
    'help.s5': 'Quelques minutes plus tard, Google vous envoie un lien par e-mail : téléchargez le .zip.',
    'help.s6': 'Revenez ici, touchez « Choisir le fichier » et sélectionnez le .zip (ou le timeline.json à l’intérieur).',
    'help.privacyHead': 'Votre vie privée :',
    'help.privacyBody': 'tout est traité sur votre téléphone. Rien n’est jamais envoyé.',
    'import.head': 'Chargez votre Timeline',
    'import.desc': 'Choisissez le .json ou .zip de votre export Google Takeout. Il reste sur votre appareil.',
    'import.choose': 'Choisir le fichier',
    'import.chooseSub': 'Timeline.json ou le .zip Takeout',
    'import.sample': 'Essayer le trajet d’exemple',
    'import.sampleHint': 'Sans fichier ? Testez avec le trajet démo Delhi → Agra.',
    'parsed.head': 'Votre trajet est chargé',
    'parsed.change': 'Choisir un autre fichier',
    'common.back': 'Retour', 'common.next': 'Continuer', 'common.close': 'Fermer', 'common.cancel': 'Annuler', 'common.delete': 'Supprimer',
    'dates.head': 'Choisissez les dates de votre voyage',
    'dates.desc': 'Sélectionnez la date de début et de fin de la vidéo.',
    'dates.from': 'Du', 'dates.to': 'Au',
    'dates.all': 'Tout le voyage', 'dates.first': 'Premier jour', 'dates.last': 'Dernier jour',
    'preview.title': 'Titre de la vidéo',
    'preview.record': 'Créer la vidéo',
    'preview.recordHint': 'La vidéo est générée sur votre téléphone — rien n’est envoyé.',
    'videos.title': 'Mes vidéos',
    'videos.import': 'Ajouter une vidéo',
    'videos.empty': 'Aucune vidéo pour l’instant',
    'videos.emptyHint': 'Créez votre première vidéo de voyage ou ajoutez un MP4 existant.',
    'videos.share': 'Partager', 'videos.save': 'Enregistrer', 'videos.delete': 'Supprimer',
    'export.tip': 'Gardez cet écran ouvert pendant le rendu de votre vidéo.',
    'export.preparing': 'Préparation…',
    'export.tiles': 'Chargement des cartes…',
    'export.rendering': 'Rendu de votre voyage…',
    'export.recording': 'Enregistrement en temps réel…',
    'export.finalizing': 'Finalisation du fichier…',
    'settings.videoHead': 'Réglages vidéo',
    'settings.size': 'Taille de la vidéo',
    'settings.sizeDesc': 'Vertical est idéal pour partager sur mobile ; horizontal pour YouTube.',
    'settings.camera': 'Mouvement de caméra',
    'settings.speed': 'Vitesse de l’animation',
    'settings.mapStyle': 'Style de carte',
    'settings.showInfo': 'Afficher date et distance',
    'settings.endZoom': 'Fin avec zoom arrière',
    'size.portrait': 'Vertical · 720×1280', 'size.portraitHd': 'Vertical HD · 1080×1920',
    'size.landscape': 'Horizontal · 1280×720', 'size.square': 'Carré · 1080×1080',
    'cam.follow': 'Suivi (fluide)', 'cam.cinematic': 'Cinéma (lent et large)', 'cam.overview': 'Vue fixe',
    'speed.slow': 'Lente', 'speed.normal': 'Normale', 'speed.fast': 'Rapide',
    'map.standard': 'Standard (rues)', 'map.dark': 'Sombre', 'map.clean': 'Simple (hors ligne)',
    'settings.langHead': 'Langue', 'settings.language': 'Langue de l’application',
    'settings.privacyHead': 'Confidentialité',
    'settings.privacyBody': 'TripReel fonctionne entièrement dans votre navigateur. Vos données de localisation ne sont jamais envoyées nulle part. Seules les tuiles de carte (rues, noms) passent par le réseau — sans jamais contenir vos positions.',
    'settings.attrib': 'Map data © OpenStreetMap contributors · Dark tiles © CARTO',
    'settings.dataHead': 'Données de l’application',
    'settings.dataBody': 'Vidéos et réglages sont stockés uniquement sur cet appareil (stockage du navigateur).',
    'settings.wipe': 'Effacer toutes les données',
    'toast.saved': 'Vidéo enregistrée dans votre bibliothèque',
    'toast.imported': 'Vidéo ajoutée',
    'toast.deleted': 'Vidéo supprimée',
    'toast.badFile': 'Impossible de lire ce fichier. Choisissez un Timeline.json ou le .zip Takeout.',
    'toast.noPoints': 'Aucun point dans cette plage. Essayez une plage plus large.',
    'toast.videoErr': 'La création a échoué dans ce navigateur. Essayez Chrome ou mettez à jour votre navigateur.',
    'toast.wiped': 'Données effacées',
    'toast.vp9note': 'Note : cet appareil ne code pas en H.264 — la vidéo utilise VP9 et peut ne pas lire sur iPhone.',
    'toast.sessionOnly': 'Mode privé : les vidéos ne vivront que dans cette session.',
    'trip.summary': '{n} points · de {from} à {to}',
    'range.summary': '{n} points · {km} km dans la plage',
    'preview.meta': '{km} km · {days} · {pts} points',
    'end.trip': 'Voyage',
    'end.madeWith': 'Fait avec TripReel · par Dev Parth',
    'days.one': '1 jour', 'days.many': '{n} jours',
    'confirm.videoTitle': 'Supprimer cette vidéo ?',
    'confirm.videoBody': 'Cette action est définitive.',
    'confirm.wipeTitle': 'Tout effacer ?',
    'confirm.wipeBody': 'Toutes les vidéos, réglages et le trajet chargé seront supprimés de cet appareil.',
    'vmeta': '{date} · {size} MB · {dur}'
  },
  de: {
    'tagline': 'Wandle deine Google Timeline in ein Reisewideo um',
    'privacy.badge': '100 % auf dem Gerät',
    'tab.create': 'Erstellen', 'tab.videos': 'Meine Videos', 'tab.settings': 'Einstellungen',
    'step.import': 'Datei', 'step.dates': 'Daten', 'step.preview': 'Vorschau',
    'help.title': 'Wo finde ich meine Timeline-Datei?',
    'help.s1': 'Der Standortverlauf muss während deiner Reise aktiviert gewesen sein (Google-App → Einstellungen → Standortverlauf).',
    'help.s2': 'Öffne takeout.google.com und melde dich bei deinem Google-Konto an.',
    'help.s3': 'Wähle alles ab, klappe „Standortverlauf“ auf und setze einen Haken bei „Timeline“.',
    'help.s4': 'Wähle den Zeitraum (deine Reise), belasse das Format „Timeline (JSON)“ und tippe „Export erstellen“.',
    'help.s5': 'Nach wenigen Minuten schickt Google dir per E-Mail einen Link – lade die .zip-Datei herunter.',
    'help.s6': 'Kehre hierher zurück, tippe „Datei auswählen“ und wähle die .zip (oder die timeline.json darin).',
    'help.privacyHead': 'Deine Privatsphäre:',
    'help.privacyBody': 'alles wird auf deinem Telefon verarbeitet. Nichts wird irgendwo hochgeladen.',
    'import.head': 'Lade deine Timeline',
    'import.desc': 'Wähle die .json oder .zip aus deinem Google Takeout-Export. Sie bleibt auf deinem Gerät.',
    'import.choose': 'Datei auswählen',
    'import.chooseSub': 'Timeline.json oder Takeout-.zip',
    'import.sample': 'Beispielreise testen',
    'import.sampleHint': 'Keine Datei? Schau dir die Demo-Tour Delhi → Agra an.',
    'parsed.head': 'Deine Reise ist geladen',
    'parsed.change': 'Andere Datei wählen',
    'common.back': 'Zurück', 'common.next': 'Weiter', 'common.close': 'Schließen', 'common.cancel': 'Abbrechen', 'common.delete': 'Löschen',
    'dates.head': 'Wähle deine Reisedaten',
    'dates.desc': 'Lege Start- und Enddatum des Videos fest.',
    'dates.from': 'Von', 'dates.to': 'Bis',
    'dates.all': 'Ganze Reise', 'dates.first': 'Erster Tag', 'dates.last': 'Letzter Tag',
    'preview.title': 'Titel des Videos',
    'preview.record': 'Video erstellen',
    'preview.recordHint': 'Das Video wird auf deinem Telefon erstellt – nichts wird hochgeladen.',
    'videos.title': 'Meine Videos',
    'videos.import': 'Video hinzufügen',
    'videos.empty': 'Noch keine Videos',
    'videos.emptyHint': 'Erstelle dein erstes Reisewideo oder füge ein MP4 hinzu.',
    'videos.share': 'Teilen', 'videos.save': 'Speichern', 'videos.delete': 'Löschen',
    'export.tip': 'Halte diesen Bildschirm geöffnet, während dein Video erstellt wird.',
    'export.preparing': 'Vorbereitung…',
    'export.tiles': 'Karten werden geladen…',
    'export.rendering': 'Deine Reise wird gerendert…',
    'export.recording': 'Wird in Echtzeit aufgenommen…',
    'export.finalizing': 'Datei wird finalisiert…',
    'settings.videoHead': 'Video-Einstellungen',
    'settings.size': 'Videogröße',
    'settings.sizeDesc': 'Hochformat ist ideal fürs Teilen; Querformat für YouTube.',
    'settings.camera': 'Kamerabewegung',
    'settings.speed': 'Animationsgeschwindigkeit',
    'settings.mapStyle': 'Kartenstil',
    'settings.showInfo': 'Datum & Strecke anzeigen',
    'settings.endZoom': 'Ende mit herausgezoomter Ansicht',
    'size.portrait': 'Hochformat · 720×1280', 'size.portraitHd': 'Hochformat HD · 1080×1920',
    'size.landscape': 'Querformat · 1280×720', 'size.square': 'Quadrat · 1080×1080',
    'cam.follow': 'Folgen (flüssig)', 'cam.cinematic': 'Kino (lang & weit)', 'cam.overview': 'Feste Gesamtansicht',
    'speed.slow': 'Langsam', 'speed.normal': 'Normal', 'speed.fast': 'Schnell',
    'map.standard': 'Standard (Straßen)', 'map.dark': 'Dunkel', 'map.clean': 'Einfach (offline)',
    'settings.langHead': 'Sprache', 'settings.language': 'App-Sprache',
    'settings.privacyHead': 'Datenschutz',
    'settings.privacyBody': 'TripReel läuft komplett in deinem Browser. Deine Standortdaten werden nie irgendwo hochgeladen. Die einzigen Netzwerk-Anfragen sind für Kartenkacheln (Straßen, Namen) – sie enthalten nie deine Positionen.',
    'settings.attrib': 'Map data © OpenStreetMap contributors · Dark tiles © CARTO',
    'settings.dataHead': 'App-Daten',
    'settings.dataBody': 'Videos und Einstellungen werden nur auf diesem Gerät gespeichert (Browser-Speicher).',
    'settings.wipe': 'Alle App-Daten löschen',
    'toast.saved': 'Video in deiner Bibliothek gespeichert',
    'toast.imported': 'Video hinzugefügt',
    'toast.deleted': 'Video gelöscht',
    'toast.badFile': 'Datei konnte nicht gelesen werden. Wähle eine Timeline.json oder Takeout-.zip.',
    'toast.noPoints': 'Keine Punkte in diesem Zeitraum. Versuche einen größeren Zeitraum.',
    'toast.videoErr': 'Video konnte in diesem Browser nicht erstellt werden. Versuche Chrome oder aktualisiere deinen Browser.',
    'toast.wiped': 'App-Daten gelöscht',
    'toast.vp9note': 'Hinweis: Dieses Gerät kann kein H.264 coden – das Video nutzt VP9 und läuft ggf. nicht auf dem iPhone.',
    'toast.sessionOnly': 'Privatmodus: Videos bleiben nur in dieser Sitzung.',
    'trip.summary': '{n} Punkte · von {from} bis {to}',
    'range.summary': '{n} Punkte · {km} km im Zeitraum',
    'preview.meta': '{km} km · {days} · {pts} Punkte',
    'end.trip': 'Reise',
    'end.madeWith': 'Erstellt mit TripReel · von Dev Parth',
    'days.one': '1 Tag', 'days.many': '{n} Tage',
    'confirm.videoTitle': 'Dieses Video löschen?',
    'confirm.videoBody': 'Das kann nicht rückgängig gemacht werden.',
    'confirm.wipeTitle': 'Alles löschen?',
    'confirm.wipeBody': 'Alle Videos, Einstellungen und die geladene Reise werden von diesem Gerät entfernt.',
    'vmeta': '{date} · {size} MB · {dur}'
  },
  ja: {
    'tagline': 'Google Timeline を旅行ビデオに',
    'privacy.badge': '100%端末内処理',
    'tab.create': '作成', 'tab.videos': 'マイビデオ', 'tab.settings': '設定',
    'step.import': 'ファイル', 'step.dates': '日付', 'step.preview': 'プレビュー',
    'help.title': 'Timeline ファイルの取り方',
    'help.s1': '旅行中にスマホの位置情報履歴がオンだったこと（Googleアプリ→設定→位置情報履歴）。',
    'help.s2': 'takeout.google.com を開いて Google アカウントにログイン。',
    'help.s3': 'すべて外して「位置情報履歴」を開き、「Timeline」にチェック。',
    'help.s4': '期間（旅行期間）を指定し、形式は「Timeline (JSON)」のまま「エクスポートを作成」。',
    'help.s5': '数分後、Google からダウンロードリンクのメールが届きます。.zip をダウンロード。',
    'help.s6': 'ここに戻り「ファイルを選択」で .zip（中の timeline.json でも可）を選択。',
    'help.privacyHead': 'プライバシー:',
    'help.privacyBody': 'すべてスマホ内で処理されます。どこにも送信されません。',
    'import.head': 'Timeline を読み込む',
    'import.desc': 'Takeout エクスポートの .json または .zip を選択。端末内に留まります。',
    'import.choose': 'ファイルを選択',
    'import.chooseSub': 'Timeline.json または Takeout の .zip',
    'import.sample': 'サンプル旅行を試す',
    'import.sampleHint': 'ファイルがない? デルヒ→アグラのデモで確認。',
    'parsed.head': '旅行データを読み込みました',
    'parsed.change': '別のファイル',
    'common.back': '戻る', 'common.next': '続ける', 'common.close': '閉じる', 'common.cancel': 'キャンセル', 'common.delete': '削除',
    'dates.head': '旅行の日付を選ぶ',
    'dates.desc': 'ビデオの開始・終了日を選択。',
    'dates.from': '開始', 'dates.to': '終了',
    'dates.all': '旅行全体', 'dates.first': '初日', 'dates.last': '最終日',
    'preview.title': 'ビデオのタイトル',
    'preview.record': 'ビデオを作成',
    'preview.recordHint': 'ビデオは端末内で生成されます。送信はされません。',
    'videos.title': 'マイビデオ',
    'videos.import': 'ビデオを追加',
    'videos.empty': 'まだビデオはありません',
    'videos.emptyHint': '最初の旅行ビデオを作成するか、既存の MP4 を追加。',
    'videos.share': '共有', 'videos.save': '保存', 'videos.delete': '削除',
    'export.tip': '生成中はこの画面を開いたままにしてください。',
    'export.preparing': '準備中…',
    'export.tiles': '地図を読み込み中…',
    'export.rendering': '旅の映像を描画中…',
    'export.recording': 'リアルタイム録画中…',
    'export.finalizing': 'ファイルを仕上げ中…',
    'settings.videoHead': 'ビデオ設定',
    'settings.size': '動画サイズ',
    'settings.sizeDesc': 'スマホ共有には縦長、YouTube には横長が向いています。',
    'settings.camera': 'カメラの動き',
    'settings.speed': 'アニメーション速度',
    'settings.mapStyle': '地図のスタイル',
    'settings.showInfo': '日付・距離を表示',
    'settings.endZoom': 'ズームアウトのエンディング',
    'size.portrait': '縦型 · 720×1280', 'size.portraitHd': '縦型 HD · 1080×1920',
    'size.landscape': '横型 · 1280×720', 'size.square': 'スクエア · 1080×1080',
    'cam.follow': 'フォロー（滑らか）', 'cam.cinematic': 'シネマ（ゆっくり広角）', 'cam.overview': '固定アングル',
    'speed.slow': '遅め', 'speed.normal': '普通', 'speed.fast': '速め',
    'map.standard': '標準（道路）', 'map.dark': 'ダーク', 'map.clean': 'シンプル（オフライン可）',
    'settings.langHead': '言語', 'settings.language': 'アプリの言語',
    'settings.privacyHead': 'プライバシー',
    'settings.privacyBody': 'TripReel はすべてブラウザ内で動作します。位置データはどこにも送信されません。ネットワーク通信は地図タイル（道路・名前）のみで、位置情報は含まれません。',
    'settings.attrib': 'Map data © OpenStreetMap contributors · Dark tiles © CARTO',
    'settings.dataHead': 'アプリデータ',
    'settings.dataBody': 'ビデオと設定はこの端末内（ブラウザの保存領域）にのみ保存されます。',
    'settings.wipe': 'すべてのアプリデータを削除',
    'toast.saved': 'ビデオがライブラリに保存されました',
    'toast.imported': 'ビデオを追加しました',
    'toast.deleted': 'ビデオを削除しました',
    'toast.badFile': 'ファイルを読み込めませんでした。Timeline.json または Takeout の .zip を選択してください。',
    'toast.noPoints': 'この期間に位置データが見つかりません。広い期間をお試しください。',
    'toast.videoErr': 'このブラウザでは作成できませんでした。Chrome またはブラウザの更新をお試しください。',
    'toast.wiped': 'アプリデータを削除しました',
    'toast.vp9note': '注意: この端末は H.264 非対応のため VP9 で保存しました。iPhone では再生できない場合があります。',
    'toast.sessionOnly': 'プライベートモード: ビデオはこのセッションのみの保存です。',
    'trip.summary': '{n} 点 · {from} 〜 {to}',
    'range.summary': '{n} 点 · 範囲内 {km} km',
    'preview.meta': '{km} km · {days} · {pts} 点',
    'end.trip': '旅',
    'end.madeWith': 'Dev Parth の TripReel で作成',
    'days.one': '1 日間', 'days.many': '{n} 日間',
    'confirm.videoTitle': 'このビデオを削除しますか?',
    'confirm.videoBody': '元に戻せません。',
    'confirm.wipeTitle': 'すべて削除しますか?',
    'confirm.wipeBody': 'すべてのビデオ・設定・読み込んだ旅行データがこの端末から削除されます。',
    'vmeta': '{date} · {size} MB · {dur}'
  }
};
const LANGS = [['en', 'English'], ['hi', 'हिन्दी'], ['es', 'Español'], ['fr', 'Français'], ['de', 'Deutsch'], ['ja', '日本語']];
let LANG = 'en';
const t = (key, p) => {
  let s = (I18N[LANG] && I18N[LANG][key]) || I18N.en[key] || key;
  if (p) for (const k in p) s = s.replace('{' + k + '}', p[k]);
  return s;
};

/* ================= constants & state ================= */
const FPS = 30;
const SIZES = {
  'portrait':    { w: 720,  h: 1280, br: 2_500_000 },
  'portrait-hd': { w: 1080, h: 1920, br: 5_000_000 },
  'landscape':   { w: 1280, h: 720,  br: 2_500_000 },
  'square':      { w: 1080, h: 1080, br: 4_000_000 }
};
const SPEEDS = { slow: 1.5, normal: 1, fast: 0.6 };
const state = {
  view: 'create', step: 1,
  settings: { lang: 'en', size: 'portrait', camera: 'follow', speed: 'normal', mapStyle: 'standard', showInfo: true, endZoom: true },
  trip: null, range: null, route: null, plan: null,
  preview: { playing: false, t: 0, raf: 0, last: 0 },
  videos: [], exporting: false, sessionOnlyWarned: false
};

/* ================= utils ================= */
const byId = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const p2 = (n) => String(n).padStart(2, '0');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const uiYield = () => new Promise((r) => setTimeout(r, 0));
const easeInOutCubic = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const smoothstep = (a, b, u) => { u = clamp((u - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
function dayStart(ms) { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); }
function dayEnd(ms) { const d = new Date(ms); d.setHours(23, 59, 59, 999); return d.getTime(); }
function dstrLocal(ms) { const d = new Date(ms); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }
function parseDstr(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d).getTime(); }
function fmtTime(sec) { sec = Math.max(0, Math.round(sec)); return Math.floor(sec / 60) + ':' + p2(sec % 60); }
function fmtDay(ms) { try { return new Intl.DateTimeFormat(LANG, { day: 'numeric', month: 'short' }).format(ms); } catch (e) { return dstrLocal(ms); } }
function fmtDateTime(ms) { try { return new Intl.DateTimeFormat(LANG, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(ms); } catch (e) { return new Date(ms).toLocaleString(); } }
function fmtDateFull(ms) { try { return new Intl.DateTimeFormat(LANG, { day: 'numeric', month: 'short', year: 'numeric' }).format(ms); } catch (e) { return dstrLocal(ms); } }
function dateRangeLabel(startMs, endMs) {
  const a = new Date(startMs), b = new Date(endMs);
  try {
    if (a.toDateString() === b.toDateString())
      return new Intl.DateTimeFormat(LANG, { day: 'numeric', month: 'long', year: 'numeric' }).format(a);
    const sameYear = a.getFullYear() === b.getFullYear();
    const sameMonth = sameYear && a.getMonth() === b.getMonth();
    if (sameMonth) {
      const m = new Intl.DateTimeFormat(LANG, { month: 'long' }).format(b);
      return a.getDate() + ' – ' + b.getDate() + ' ' + m + ' ' + b.getFullYear();
    }
    if (sameYear) {
      const ma = new Intl.DateTimeFormat(LANG, { month: 'short' }).format(a);
      const mb = new Intl.DateTimeFormat(LANG, { month: 'short' }).format(b);
      return a.getDate() + ' ' + ma + ' – ' + b.getDate() + ' ' + mb + ' ' + b.getFullYear();
    }
    return new Intl.DateTimeFormat(LANG, { day: 'numeric', month: 'short', year: 'numeric' }).format(a) + ' – ' +
      new Intl.DateTimeFormat(LANG, { day: 'numeric', month: 'short', year: 'numeric' }).format(b);
  } catch (e) { return fmtDay(startMs) + ' – ' + fmtDay(endMs); }
}
function daysLabel(n) { return n <= 1 ? t('days.one') : t('days.many', { n }); }
function slug(s) { return (s || 'trip').toLowerCase().replace(/[^\p{L}\p{N}\-_ ]/gu, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'trip'; }
function roundRectPath(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function toast(msg, kind, ms) {
  const box = byId('toasts'); if (!box) return;
  const el = document.createElement('div');
  el.className = 'toast' + (kind === 'err' ? ' err' : '');
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .4s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 450); }, ms || 3500);
}

/* ================= storage (IndexedDB + in-memory fallback) ================= */
const db = {
  ok: false, memVideos: [],
  init() {
    return new Promise((res) => {
      try {
        const rq = indexedDB.open('treel', 1);
        rq.onupgradeneeded = () => {
          const d = rq.result;
          if (!d.objectStoreNames.contains('videos')) d.createObjectStore('videos', { keyPath: 'id' });
          if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv', { keyPath: 'k' });
        };
        rq.onsuccess = () => { this.ok = true; this._db = rq.result; res(true); };
        rq.onerror = () => res(false);
        rq.onblocked = () => res(false);
      } catch (e) { res(false); }
    });
  },
  _tx(mode, store) { return this._db.transaction(store || 'videos', mode).objectStore(store || 'videos'); },
  _op(req) { return new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); }); },
  async addVideo(rec) {
    if (this.ok) { try { await this._op(this._tx('readwrite').add(rec)); return; } catch (e) { } }
    this.memVideos.push(rec);
  },
  async listVideos() {
    if (this.ok) { try { return await this._op(this._tx('readonly').getAll()); } catch (e) { } }
    return [...this.memVideos];
  },
  async deleteVideo(id) {
    if (this.ok) { try { await this._op(this._tx('readwrite').delete(id)); return; } catch (e) { } }
    this.memVideos = this.memVideos.filter(v => v.id !== id);
  },
  async clear() {
    if (this.ok) {
      try { await this._op(this._tx('readwrite').clear()); await this._op(this._tx('readwrite', 'kv').clear()); } catch (e) { }
    }
    this.memVideos = [];
  },
  async getKV(k) {
    if (!this.ok) return null;
    try { return await this._op(this._tx('readonly', 'kv').get(k)); } catch (e) { return null; }
  },
  async setKV(k, v) {
    if (!this.ok) return;
    try { await this._op(this._tx('readwrite', 'kv').put({ k, v })); } catch (e) { }
  }
};
function saveSettings() { db.setKV('settings', state.settings); }

/* ================= timeline parsing ================= */
function extractPoints(doc) {
  const out = [];
  const push = (tm, lat, lng) => {
    if (isFinite(tm) && isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && tm > 0) out.push({ t: +tm, lat: +lat, lng: +lng });
  };
  // Format A: Takeout "Timeline (JSON)" — { timeline: { items: [...] } }
  if (doc.timeline && Array.isArray(doc.timeline.items)) {
    for (const it of doc.timeline.items) {
      let lat = it.lat, lng = it.lng;
      if (lat == null && it.checkIn && it.checkIn.location) { lat = it.checkIn.location.latitude; lng = it.checkIn.location.longitude; }
      push(it.dateTime ? Date.parse(it.dateTime) : null, lat, lng);
    }
  }
  // Format B: raw "Location History (JSON)" — { locations: [...] } with E7 ints
  if (Array.isArray(doc.locations)) {
    for (const it of doc.locations) push(it.timestampMs != null ? it.timestampMs : it.timestamp, it.latitudeE7 / 1e7, it.longitudeE7 / 1e7);
  }
  // Format C: semantic timeline objects (placeVisit / activitySegment), possibly nested by month
  const findSemantic = (obj, depth) => {
    const res = [];
    if (!obj || typeof obj !== 'object' || depth > 3) return res;
    if (obj.placeVisit || obj.activitySegment) res.push(obj);
    for (const k of Object.keys(obj)) {
      if (k === 'timeline' || k === 'locations') continue;
      const v = obj[k];
      if (v && typeof v === 'object') res.push(...findSemantic(v, depth + 1));
    }
    return res;
  };
  for (const o of findSemantic(doc, 0)) {
    for (const v of o.placeVisit || []) {
      const d = v.duration || {}, l = v.location || {};
      push(d.startTimestampMs, l.latitudeE7 / 1e7, l.longitudeE7 / 1e7);
    }
    for (const a of o.activitySegment || []) {
      for (const p of (a.simplifiedRawPath && a.simplifiedRawPath.points) || []) push(p.timestampMs, p.latE7 / 1e7, p.lngE7 / 1e7);
    }
  }
  return out;
}

/* ================= geometry & route ================= */
const mercX = (lng) => (lng + 180) / 360;
function mercY(lat) {
  const r = lat * Math.PI / 180;
  return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2;
}
function haversineKm(a, b) {
  const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
function crPoint(u, p0, p1, p2, p3) {
  return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
}
function catmullRom(pts, n) {
  const P = [pts[0], ...pts, pts[pts.length - 1]];
  const segs = pts.length - 1, res = [];
  for (let s = 0; s < segs; s++) {
    const p0 = P[s], p1 = P[s + 1], p2 = P[s + 2], p3 = P[s + 3];
    const m = Math.max(2, Math.round(n / segs));
    for (let j = 0; j < m; j++) {
      const u = j / m;
      res.push({ lat: crPoint(u, p0.lat, p1.lat, p2.lat, p3.lat), lng: crPoint(u, p0.lng, p1.lng, p2.lng, p3.lng), t: p1.t + u * (p2.t - p1.t) });
    }
  }
  res.push({ lat: pts[pts.length - 1].lat, lng: pts[pts.length - 1].lng, t: pts[pts.length - 1].t });
  return res;
}
function buildRoute(trip, range) {
  let pts = trip.points.filter(p => p.t >= range.start && p.t <= range.end).sort((a, b) => a.t - b.t);
  if (!pts.length) return null;
  // drop near-duplicate consecutive points
  const ded = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = ded[ded.length - 1], b = pts[i];
    const dKm = haversineKm(a, b);
    if (dKm > 0.002 || b.t - a.t > 90000) ded.push(b);
  }
  pts = ded;
  // downsample very dense data
  if (pts.length > 4000) {
    const stride = pts.length / 4000, out = [];
    for (let i = 0; i < 4000; i++) out.push(pts[Math.min(pts.length - 1, Math.floor(i * stride))]);
    out[out.length - 1] = pts[pts.length - 1];
    pts = out;
  }
  // smooth sparse routes
  let path = pts.length >= 2 && pts.length < 80 ? catmullRom(pts, 240) : pts.map(p => ({ lat: p.lat, lng: p.lng, t: p.t }));
  let cum = 0;
  const rpts = [];
  for (const p of path) {
    const o = { lat: p.lat, lng: p.lng, t: p.t, x: mercX(p.lng), y: mercY(p.lat) };
    if (rpts.length > 0) cum += haversineKm(o, rpts[rpts.length - 1]);
    o.cum = cum;
    rpts.push(o);
  }
  const totalKm = cum;
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of rpts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
  if (!isFinite(x0)) { x0 = x1 = mercX(pts[0].lng); y0 = y1 = mercY(pts[0].lat); }
  // days (calendar days touched)
  let days = 1;
  if (rpts.length > 1) {
    let d = dayStart(rpts[0].t), n = 1;
    const last = dayStart(rpts[rpts.length - 1].t);
    while (d < last) { d += 86400000; n++; if (n > 400) break; }
    days = n;
  }
  const route = {
    pts: rpts, totalKm, days,
    bbox: { x0, x1, y0, y1 },
    minT: rpts[0].t, maxT: rpts[rpts.length - 1].t,
    pointAtLength(s) {
      const pts2 = rpts;
      if (s <= 0) return pts2[0];
      if (s >= totalKm) return pts2[pts2.length - 1];
      let lo = 0, hi = pts2.length - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (pts2[m].cum < s) lo = m; else hi = m; }
      const a = pts2[lo], b = pts2[hi], f = (s - a.cum) / Math.max(1e-9, b.cum - a.cum);
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, t: a.t + (b.t - a.t) * f, lat: a.lat + (b.lat - a.lat) * f, lng: a.lng + (b.lng - a.lng) * f };
    }
  };
  return route;
}
function fitCamera(bbox, W, H, pad) {
  const cx = (bbox.x0 + bbox.x1) / 2, cy = (bbox.y0 + bbox.y1) / 2;
  const bw = bbox.x1 - bbox.x0, bh = bbox.y1 - bbox.y0;
  let S;
  if (bw < 1e-7 && bh < 1e-7) S = 256 * Math.pow(2, 13);
  else S = Math.min(W * (1 - 2 * pad) / Math.max(bw, 1e-7), H * (1 - 2 * pad) / Math.max(bh, 1e-7));
  return { cx, cy, zoom: clamp(Math.log2(S / 256), 2.5, 16) };
}
function routeAnimSeconds(route) {
  let base;
  if (route.totalKm < 1) base = 8;
  else base = clamp(8 + route.totalKm / 8, 10, 40);
  return base * SPEEDS[state.settings.speed];
}
function buildCamPath(route, W, H, s, Nanim, Nout, Nend) {
  const fit = fitCamera(route.bbox, W, H, 0.22);
  const fitEnd = fitCamera(route.bbox, W, H, 0.34);
  const followZoom = clamp(fit.zoom + 1.15, fit.zoom + 0.4, fit.zoom + 1.8);
  const followZoomCin = clamp(fit.zoom + 0.75, fit.zoom + 0.3, fit.zoom + 1.2);
  const single = route.totalKm < 0.05;
  const path = [];
  let cx = 0, cy = 0, lz = 0, init = false;
  const dt = 1 / FPS, k = 1 - Math.exp(-dt / (s.camera === 'cinematic' ? 0.6 : 0.38));
  const lead = 0.05;
  for (let i = 0; i < Nanim; i++) {
    const u = i / Nanim;
    let tx, ty, tz;
    if (single) { tx = route.pts[0].x; ty = route.pts[0].y; tz = clamp(followZoom, 4, 14.5); }
    else if (s.camera === 'overview') { tx = fit.cx; ty = fit.cy; tz = fit.zoom; }
    else {
      const p = route.pointAtLength(Math.min(1, u + lead) * route.totalKm);
      tx = p.x; ty = p.y; tz = s.camera === 'cinematic' ? followZoomCin : followZoom;
    }
    if (!init) {
      cx = tx; cy = ty;
      lz = (s.camera === 'overview' && !single) ? fit.zoom + 0.4 : tz;
      init = true;
    } else {
      cx += (tx - cx) * k; cy += (ty - cy) * k; lz += (tz - lz) * k;
    }
    path.push({ cx, cy, z: clamp(lz, 2.5, 16.5) });
  }
  const lastCam = path[path.length - 1];
  const eZoom = fitEnd.zoom;
  if (s.endZoom && Nout > 0) {
    for (let i = 1; i <= Nout; i++) {
      const p = easeInOutCubic(i / Nout);
      path.push({ cx: lastCam.cx + (fitEnd.cx - lastCam.cx) * p, cy: lastCam.cy + (fitEnd.cy - lastCam.cy) * p, z: lastCam.z + (eZoom - lastCam.z) * p });
    }
    for (let i = Nout; i < Nend; i++) path.push({ cx: fitEnd.cx, cy: fitEnd.cy, z: eZoom });
  } else {
    for (let i = 1; i < Nend; i++) path.push({ cx: lastCam.cx, cy: lastCam.cy, z: lastCam.z });
  }
  return path;
}
function buildPlan() {
  const S = SIZES[state.settings.size];
  const route = state.route;
  if (!route) return;
  const Nanim = Math.max(90, Math.round(routeAnimSeconds(route) * FPS));
  const Nend = Math.round((state.settings.endZoom ? 6.5 : 1.5) * FPS);
  const Nout = state.settings.endZoom ? Math.round(4 * FPS) : 0;
  const camPath = buildCamPath(route, S.w, S.h, state.settings, Nanim, Nout, Nend);
  state.plan = {
    W: S.w, H: S.h, bitrate: S.br, route, Nanim, Nend, Nout,
    Ntotal: Nanim + Nend, camPath,
    durationSec: (Nanim + Nend) / FPS
  };
  const c = byId('mapCanvas');
  if (c) { c.width = S.w; c.height = S.h; }
  fitMapwrap();
  state.preview.t = 0;
}
function frameState(i) {
  const P = state.plan;
  const cam = P.camPath[Math.min(i, P.camPath.length - 1)];
  const inAnim = i < P.Nanim;
  const u = inAnim ? i / P.Nanim : 1;
  const s = state.settings;
  const phase = inAnim ? 'anim' : (s.endZoom && i < P.Nanim + P.Nout ? 'out' : 'hold');
  let endAlpha = 0;
  if (s.endZoom && i >= P.Nanim) endAlpha = smoothstep(0.45, 1, (i - P.Nanim) / P.Nend);
  const fadeIn = Math.min(1, i / 18);
  const fadeOut = Math.min(1, (P.Ntotal - 1 - i) / 20);
  return {
    cam, u, phase, endAlpha, frame: i,
    fade: Math.min(fadeIn, fadeOut),
    dateStr: fmtDateTime(P.route.pointAtLength(u * P.route.totalKm).t),
    kmStr: (P.route.totalKm * u) >= 100 ? Math.round(P.route.totalKm * u) + ' km' : (P.route.totalKm * u).toFixed(1) + ' km',
    title: (state._videoTitle || t('end.trip')).slice(0, 60),
    dateLabel: dateRangeLabel(state.range.start, state.range.end),
    statsLabel: (P.route.totalKm >= 100 ? Math.round(P.route.totalKm) : P.route.totalKm.toFixed(1)) + ' km · ' + daysLabel(P.route.days),
    madeWith: t('end.madeWith')
  };
}

/* ================= tiles ================= */
const tileCache = new Map();
function tileKey(style, z, x, y) { return style + '/' + z + '/' + x + '/' + y; }
function tileUrl(style, z, x, y) {
  return style === 'dark'
    ? 'https://basemaps.cartocdn.com/dark_all/' + z + '/' + x + '/' + y + '.png'
    : 'https://tile.openstreetmap.org/' + z + '/' + x + '/' + y + '.png';
}
function loadTile(style, z, x, y) {
  const key = tileKey(style, z, x, y);
  let r = tileCache.get(key);
  if (!r) {
    r = { state: 'load', img: null };
    if (tileCache.size > 800) { const first = tileCache.keys().next().value; tileCache.delete(first); }
    tileCache.set(key, r);
    if (!navigator.onLine) { r.state = 'fail'; return r; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const to = setTimeout(() => { if (r.state === 'load') r.state = 'fail'; }, 6000);
    img.onload = () => { clearTimeout(to); if (r.state === 'load') { r.state = 'ok'; r.img = img; } };
    img.onerror = () => { clearTimeout(to); if (r.state === 'load') r.state = 'fail'; };
    img.src = tileUrl(style, z, x, y);
  }
  return r;
}
function viewportTiles(cam, W, H) {
  const style = state.settings.mapStyle;
  const L = clamp(Math.round(cam.z), 3, 17);
  const n = 1 << L;
  const S = 256 * Math.pow(2, cam.z);
  const x0 = cam.cx - W / (2 * S), x1 = cam.cx + W / (2 * S);
  const y0 = cam.cy - H / (2 * S), y1 = cam.cy + H / (2 * S);
  const tx0 = Math.max(0, Math.floor(x0 * n)), tx1 = Math.min(n - 1, Math.floor(x1 * n));
  const ty0 = Math.max(0, Math.floor(y0 * n)), ty1 = Math.min(n - 1, Math.floor(y1 * n));
  const out = [];
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) out.push([L, tx, ty]);
  return out;
}
function drawTiles(ctx, W, H, cam) {
  const style = state.settings.mapStyle;
  const L = clamp(Math.round(cam.z), 3, 17);
  const n = 1 << L;
  const S = 256 * Math.pow(2, cam.z);
  const ts = 256 * Math.pow(2, cam.z - L);
  const x0 = cam.cx - W / (2 * S), x1 = cam.cx + W / (2 * S);
  const y0 = cam.cy - H / (2 * S), y1 = cam.cy + H / (2 * S);
  const tx0 = Math.max(0, Math.floor(x0 * n)), tx1 = Math.min(n - 1, Math.floor(x1 * n));
  const ty0 = Math.max(0, Math.floor(y0 * n)), ty1 = Math.min(n - 1, Math.floor(y1 * n));
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const r = tileCache.get(tileKey(style, L, tx, ty));
      if (r && r.state === 'ok' && r.img) {
        const dx = (tx / n - cam.cx) * S + W / 2;
        const dy = (ty / n - cam.cy) * S + H / 2;
        ctx.drawImage(r.img, dx, dy, ts + 0.6, ts + 0.6);
      }
    }
  }
}
async function prefetchTiles(onProgress) {
  const style = state.settings.mapStyle;
  if (style === 'clean' || !state.plan) { onProgress(1); return; }
  const P = state.plan;
  const set = new Map();
  const step = Math.max(1, Math.floor(P.camPath.length / 140));
  for (let i = 0; i < P.camPath.length; i += step) {
    for (const [L, tx, ty] of viewportTiles(P.camPath[i], P.W, P.H)) {
      const key = tileKey(style, L, tx, ty);
      if (!set.has(key)) { set.set(key, [L, tx, ty]); loadTile(style, L, tx, ty); }
    }
  }
  const list = [...set.values()];
  if (!list.length) { onProgress(1); return; }
  let done = 0, idx = 0;
  await new Promise((res) => {
    const worker = async () => {
      while (idx < list.length) {
        const j = idx++;
        const [L, tx, ty] = list[j];
        const r = loadTile(style, L, tx, ty);
        // wait until resolved
        const t0 = performance.now();
        while (r.state === 'load' && performance.now() - t0 < 6500) await uiYield();
        done++;
        if (done % 8 === 0 || done === list.length) onProgress(done / list.length);
      }
    };
    Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]).then(res);
  });
  onProgress(1);
}

/* ================= map rendering ================= */
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans", "Helvetica Neue", Arial, sans-serif';
function drawGraticule(ctx, W, H, cam, style) {
  const S = 256 * Math.pow(2, cam.z);
  const pxPerDegLng = S / 360;
  const steps = [60, 30, 15, 5, 2, 1, 0.5, 0.2, 0.1];
  let step = steps[steps.length - 1];
  for (const st of steps) { if (st * pxPerDegLng >= 64) { step = st; break; } }
  const x0 = cam.cx - W / (2 * S), x1 = cam.cx + W / (2 * S);
  const y0 = cam.cy - H / (2 * S), y1 = cam.cy + H / (2 * S);
  const color = style === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(90,130,120,0.18)';
  ctx.strokeStyle = color; ctx.lineWidth = 1;
  const latFromY = (yw) => (2 * Math.atan(Math.exp((1 - 2 * yw) * Math.PI)) - Math.PI / 2) * 180 / Math.PI;
  const degLng0 = x0 * 360 - 180, degLng1 = x1 * 360 - 180;
  for (let lon = Math.ceil(degLng0 / step) * step; lon <= degLng1; lon += step) {
    const sx = (mercX(lon) - cam.cx) * S + W / 2;
    ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, H); ctx.stroke();
  }
  const lat0 = latFromY(y1), lat1 = latFromY(y0);
  for (let lat = Math.ceil(lat0 / step) * step; lat <= lat1; lat += step) {
    const sy = (mercY(lat) - cam.cy) * S + H / 2;
    ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy); ctx.stroke();
  }
}
function drawPinDot(ctx, x, y, color, k) {
  ctx.beginPath(); ctx.ellipse(x, y + 2 * k, 6.5 * k, 3 * k, 0, 0, 7); ctx.fillStyle = 'rgba(10,20,20,.25)'; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, 8 * k, 0, 7);
  ctx.fillStyle = color; ctx.fill();
  ctx.lineWidth = 2.6 * k; ctx.strokeStyle = '#fff'; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, 2.6 * k, 0, 7); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fill();
}
function drawMarker(ctx, x, y, frame, k) {
  const R = 15 * k, cy0 = y - 26 * k;
  const ph = frame * 0.3;
  const pr = 15 * k + 9 * k * (0.5 + 0.5 * Math.sin(ph));
  ctx.beginPath(); ctx.arc(x, cy0 + 6 * k, pr, 0, 7);
  ctx.strokeStyle = 'rgba(20,184,166,' + (0.16 + 0.1 * (0.5 + 0.5 * Math.sin(ph))) + ')';
  ctx.lineWidth = 3 * k; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x, y + 3 * k, 9.5 * k, 4.2 * k, 0, 0, 7); ctx.fillStyle = 'rgba(10,20,20,.3)'; ctx.fill();
  ctx.beginPath();
  ctx.arc(x, cy0, R, 3 * Math.PI / 4, Math.PI / 4 + 2 * Math.PI);
  ctx.lineTo(x, y - 1.5 * k);
  ctx.closePath();
  ctx.fillStyle = '#0f766e'; ctx.fill();
  ctx.lineWidth = 3.2 * k; ctx.strokeStyle = '#fff'; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, cy0, 5.5 * k, 0, 7); ctx.fillStyle = '#fff'; ctx.fill();
}
function drawChip(ctx, x, y, text, k, alignRight) {
  const fs = 20 * k;
  ctx.font = '700 ' + fs + 'px ' + FONT;
  const w = ctx.measureText(text).width + 28 * k, h = 36 * k, r = 12 * k;
  const rx = alignRight ? x - w : x;
  roundRectPath(ctx, rx, y, w, h, r);
  ctx.fillStyle = 'rgba(12,26,26,.74)'; ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillText(text, rx + 14 * k, y + h / 2 + 1);
}
function drawEndCard(ctx, W, H, f, k) {
  const a = f.endAlpha;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(8,18,18,.38)'; ctx.fillRect(0, 0, W, H);
  const cw = W * 0.84, ch = H * 0.3;
  const x = (W - cw) / 2, y = (H - ch) / 2 - H * 0.015;
  roundRectPath(ctx, x, y, cw, ch, 22 * k);
  ctx.fillStyle = 'rgba(13,27,26,.93)'; ctx.fill();
  ctx.lineWidth = 1.5 * k; ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  // title (shrink to fit)
  let fsT = 34 * k;
  ctx.font = '800 ' + fsT + 'px ' + FONT;
  while (ctx.measureText(f.title).width > cw - 60 * k && fsT > 16 * k) { fsT -= 2 * k; ctx.font = '800 ' + fsT + 'px ' + FONT; }
  ctx.fillStyle = '#fff';
  ctx.fillText(f.title, W / 2, y + ch * 0.3);
  ctx.font = '600 ' + 21 * k + 'px ' + FONT; ctx.fillStyle = '#bfe3dc';
  ctx.fillText(f.dateLabel, W / 2, y + ch * 0.53);
  ctx.font = '700 ' + 20 * k + 'px ' + FONT; ctx.fillStyle = '#8fd0c4';
  ctx.fillText(f.statsLabel, W / 2, y + ch * 0.72);
  ctx.font = '600 ' + 13.5 * k + 'px ' + FONT; ctx.fillStyle = 'rgba(255,255,255,.5)';
  ctx.fillText(f.madeWith, W / 2, y + ch * 0.9);
  ctx.restore();
}
function drawFrame(ctx, W, H, f) {
  const s = state.settings;
  const style = s.mapStyle;
  const k = W / 720;
  const dark = style === 'dark';
  const S = 256 * Math.pow(2, f.cam.z);
  const proj = (x, y) => [(x - f.cam.cx) * S + W / 2, (y - f.cam.cy) * S + H / 2];
  // background
  if (style === 'clean') {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#eaf1ec'); g.addColorStop(1, '#dce8e1');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    drawGraticule(ctx, W, H, f.cam, 'clean');
  } else if (style === 'dark') {
    ctx.fillStyle = '#0e141b'; ctx.fillRect(0, 0, W, H);
    drawGraticule(ctx, W, H, f.cam, 'dark');
    drawTiles(ctx, W, H, f.cam);
  } else {
    ctx.fillStyle = '#c8dce6'; ctx.fillRect(0, 0, W, H);
    drawGraticule(ctx, W, H, f.cam, 'clean');
    drawTiles(ctx, W, H, f.cam);
  }
  // route
  const P = state.plan, pts = P.route.pts;
  const scr = new Array(pts.length);
  for (let i = 0; i < pts.length; i++) scr[i] = proj(pts[i].x, pts[i].y);
  const cur = P.route.pointAtLength(f.u * P.route.totalKm);
  const curScr = proj(cur.x, cur.y);
  const fullPath = new Path2D();
  fullPath.moveTo(scr[0][0], scr[0][1]);
  for (let i = 1; i < scr.length; i++) fullPath.lineTo(scr[i][0], scr[i][1]);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = dark ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.85)';
  ctx.lineWidth = 8 * k; ctx.stroke(fullPath);
  ctx.strokeStyle = dark ? '#2dd4bf' : '#0d9488';
  ctx.lineWidth = 4.5 * k; ctx.stroke(fullPath);
  if (f.u > 0.002) {
    const sCur = f.u * P.route.totalKm;
    const trav = new Path2D();
    trav.moveTo(scr[0][0], scr[0][1]);
    for (let i = 1; i < scr.length && pts[i].cum <= sCur; i++) trav.lineTo(scr[i][0], scr[i][1]);
    trav.lineTo(curScr[0], curScr[1]);
    ctx.save();
    ctx.shadowColor = dark ? 'rgba(94,234,212,.75)' : 'rgba(13,148,136,.65)';
    ctx.shadowBlur = 12 * k;
    ctx.strokeStyle = dark ? '#5eead4' : '#14b8a6';
    ctx.lineWidth = 5.5 * k; ctx.stroke(trav);
    ctx.restore();
  }
  // start / end pins
  drawPinDot(ctx, scr[0][0], scr[0][1], '#22c55e', k);
  drawPinDot(ctx, scr[scr.length - 1][0], scr[scr.length - 1][1], '#ef4444', k);
  // marker
  drawMarker(ctx, curScr[0], curScr[1], f.frame, k);
  // info chips
  if (s.showInfo && f.phase === 'anim') {
    drawChip(ctx, W * 0.03, H * 0.03, f.dateStr, k, false);
    drawChip(ctx, W * 0.97, H * 0.03, f.kmStr, k, true);
  }
  // end card
  if (f.endAlpha > 0) drawEndCard(ctx, W, H, f, k);
  // fade in/out
  if (f.fade < 1) {
    ctx.fillStyle = 'rgba(8,15,16,' + (1 - f.fade).toFixed(3) + ')';
    ctx.fillRect(0, 0, W, H);
  }
}

/* ================= preview ================= */
function fitMapwrap() {
  const P = state.plan;
  const wrap = byId('mapwrap');
  if (!P || !wrap) return;
  const ar = P.W / P.H;
  const maxH = Math.min(window.innerHeight * 0.6, 720);
  const maxW = Math.max(220, wrap.parentElement.clientWidth - 32);
  const w = Math.min(maxW, maxH * ar);
  wrap.style.width = Math.round(w) + 'px';
  wrap.style.aspectRatio = String(ar);
}
function renderPreview() {
  const P = state.plan;
  if (!P) return;
  const c = byId('mapCanvas');
  const ctx = c.getContext('2d');
  const i = Math.min(P.Ntotal - 1, Math.max(0, Math.floor(state.preview.t * FPS)));
  drawFrame(ctx, P.W, P.H, frameState(i));
  byId('scrub').value = Math.round(i / (P.Ntotal - 1) * 1000);
  byId('timecode').textContent = fmtTime(state.preview.t) + ' / ' + fmtTime(P.durationSec);
}
function previewTick(ts) {
  if (!state.preview.playing) return;
  if (!state.preview.last) state.preview.last = ts;
  const dt = Math.min(0.1, (ts - state.preview.last) / 1000);
  state.preview.last = ts;
  const P = state.plan;
  state.preview.t += dt;
  if (state.preview.t >= P.durationSec) { state.preview.t = P.durationSec; setPlaying(false); }
  renderPreview();
  if (state.preview.playing) state.preview.raf = requestAnimationFrame(previewTick);
}
function setPlaying(on) {
  const P = state.plan;
  if (!P) return;
  if (on) {
    if (state.preview.t >= P.durationSec - 0.05) state.preview.t = 0;
    state.preview.playing = true; state.preview.last = 0;
    cancelAnimationFrame(state.preview.raf);
    state.preview.raf = requestAnimationFrame(previewTick);
  } else {
    state.preview.playing = false;
    cancelAnimationFrame(state.preview.raf);
  }
  byId('iconPlay').style.display = on ? 'none' : '';
  byId('iconPause').style.display = on ? '' : 'none';
}
function updatePreviewMeta() {
  const el = byId('previewMeta');
  if (!el || !state.route) return;
  el.textContent = t('preview.meta', {
    km: state.route.totalKm >= 100 ? Math.round(state.route.totalKm) : state.route.totalKm.toFixed(1),
    days: daysLabel(state.route.days),
    pts: state.route.pts.length
  });
}
function updateAttrib() {
  const el = byId('mapAttrib');
  if (!el) return;
  const style = state.settings.mapStyle;
  let txt = '';
  if (style === 'standard') txt = '© OpenStreetMap contributors';
  else if (style === 'dark') txt = '© OpenStreetMap contributors · © CARTO';
  if (txt && !navigator.onLine) txt += ' · offline';
  el.textContent = txt;
  el.classList.toggle('dark', style !== 'dark');
}

/* ================= export engine ================= */
async function chooseBackend(W, H) {
  if (window.Mediabunny && typeof window.VideoEncoder !== 'undefined') {
    try {
      const enc = await window.Mediabunny.getEncodableVideoCodecs(['avc', 'hevc', 'vp9'], { width: W, height: H });
      const codec = ['avc', 'hevc', 'vp9'].find(c => enc.includes(c));
      if (codec) return { kind: 'mediabunny', codec };
    } catch (e) { /* fall through */ }
  }
  if (window.MediaRecorder && typeof HTMLCanvasElement !== 'undefined' && HTMLCanvasElement.prototype.captureStream) {
    const mimes = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
    for (const m of mimes) {
      try { if (MediaRecorder.isTypeSupported(m)) return { kind: 'recorder', mime: m }; } catch (e) { }
    }
  }
  return null;
}
function setPhase(text, pct) {
  byId('exportPhase').textContent = text;
  byId('exportProgress').style.width = (clamp(pct, 0, 1) * 100).toFixed(1) + '%';
  byId('exportPct').textContent = Math.round(clamp(pct, 0, 1) * 100) + '%';
}
async function exportMediaBunny(canvas, codec, title, onProgress) {
  const P = state.plan;
  const MB = window.Mediabunny;
  const output = new MB.Output({ format: new MB.Mp4OutputFormat(), target: new MB.BufferTarget() });
  const source = new MB.CanvasSource(canvas, {
    codec,
    quality: new MB.Quality({ quality: 0.75, preferBitrate: true }),
    keyFrameInterval: 2
  });
  output.addVideoTrack(source);
  try { output.setMetadataTags({ title, artist: 'TripReel' }); } catch (e) { }
  await output.start();
  for (let i = 0; i < P.Ntotal; i++) {
    drawFrame(canvas.getContext('2d'), P.W, P.H, frameState(i));
    await source.add(i / FPS, 1 / FPS);
    if (i % 4 === 0) { onProgress(i / P.Ntotal); await uiYield(); }
  }
  await source.close();
  await output.finalize();
  const buf = output.target.buffer;
  if (!buf) throw new Error('no output buffer');
  return new Blob([buf], { type: 'video/mp4' });
}
async function exportRecorder(canvas, mime, onProgress) {
  const P = state.plan;
  const stream = canvas.captureStream(FPS);
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: P.bitrate });
  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  const stopped = new Promise((r) => { rec.onstop = r; });
  const ctx = canvas.getContext('2d');
  drawFrame(ctx, P.W, P.H, frameState(0));
  rec.start(250);
  const t0 = performance.now();
  await new Promise((res) => {
    (function loop() {
      const el = (performance.now() - t0) / 1000;
      const i = Math.min(P.Ntotal - 1, Math.floor(el * FPS));
      drawFrame(ctx, P.W, P.H, frameState(i));
      onProgress(Math.min(1, (el * FPS) / P.Ntotal));
      if (el * FPS >= P.Ntotal - 1) res(); else requestAnimationFrame(loop);
    })();
  });
  rec.stop();
  await stopped;
  const type = mime.split(';')[0];
  return { blob: new Blob(chunks, { type }), ext: type.includes('mp4') ? 'mp4' : 'webm' };
}
function capturePoster() {
  const P = state.plan;
  return new Promise((res) => {
    try {
      const sc = Math.min(1, 480 / P.W);
      const c = document.createElement('canvas');
      c.width = Math.max(2, Math.round(P.W * sc));
      c.height = Math.max(2, Math.round(P.H * sc));
      drawFrame(c.getContext('2d'), c.width, c.height, frameState(Math.floor(P.Ntotal * 0.45)));
      c.toBlob((b) => res(b || null), 'image/jpeg', 0.72);
    } catch (e) { res(null); }
  });
}
async function generateVideo(title) {
  if (state.exporting || !state.plan) return;
  state.exporting = true;
  state._videoTitle = title;
  const P = state.plan;
  const canvas = byId('exportCanvas');
  canvas.width = P.W; canvas.height = P.H;
  byId('exportOverlay').hidden = false;
  setPhase(t('export.preparing'), 0);
  let poster = null, rec = null;
  try {
    setPhase(t('export.tiles'), 0);
    await prefetchTiles((p) => setPhase(t('export.tiles'), p * 0.5));
    const backend = await chooseBackend(P.W, P.H);
    if (!backend) throw new Error('no backend');
    if (backend.codec === 'vp9') toast(t('toast.vp9note'), 'err', 6000);
    let blob = null, ext = 'mp4';
    if (backend.kind === 'mediabunny') {
      setPhase(t('export.rendering'), 0.52);
      blob = await exportMediaBunny(canvas, backend.codec, title, (p) => setPhase(t('export.rendering'), 0.52 + p * 0.44));
    } else {
      setPhase(t('export.recording'), 0.52);
      const r = await exportRecorder(canvas, backend.mime, (p) => setPhase(t('export.recording'), 0.52 + p * 0.44));
      blob = r.blob; ext = r.ext;
    }
    setPhase(t('export.finalizing'), 0.97);
    poster = await capturePoster();
    rec = {
      id: uid(), title, name: slug(title) + '.' + ext, createdAt: Date.now(),
      startT: state.range.start, endT: state.range.end,
      blob, width: P.W, height: P.H, durationMs: Math.round(P.durationSec * 1000),
      size: blob.size, thumb: poster, source: 'generated', ext
    };
    await db.addVideo(rec);
    state.videos.unshift(rec);
    renderVideos();
    setPhase('', 1);
    await uiYield();
    byId('exportOverlay').hidden = true;
    toast(t('toast.saved'));
    openPlayer(rec);
  } catch (err) {
    console.error('export failed', err);
    byId('exportOverlay').hidden = true;
    toast(t('toast.videoErr'), 'err', 6000);
  } finally {
    state.exporting = false;
  }
}

/* ================= videos gallery ================= */
let thumbURLs = [];
function renderVideos() {
  const grid = byId('videoGrid');
  if (!grid) return;
  thumbURLs.forEach((u) => URL.revokeObjectURL(u));
  thumbURLs = [];
  grid.innerHTML = '';
  byId('videoEmpty').hidden = state.videos.length > 0;
  for (const v of state.videos) {
    const card = document.createElement('div');
    card.className = 'vcard';
    const thumb = document.createElement('div');
    thumb.className = 'vthumb';
    if (v.thumb) {
      const img = document.createElement('img');
      img.alt = '';
      img.src = URL.createObjectURL(v.thumb);
      thumbURLs.push(img.src);
      thumb.appendChild(img);
    }
    const badge = document.createElement('div');
    badge.className = 'playbadge';
    badge.innerHTML = '<span><svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg></span>';
    thumb.appendChild(badge);
    const len = document.createElement('div');
    len.className = 'vlen';
    len.textContent = fmtTime((v.durationMs || 0) / 1000);
    thumb.appendChild(len);
    thumb.addEventListener('click', () => openPlayer(v));
    const body = document.createElement('div');
    body.className = 'vbody';
    const ti = document.createElement('div');
    ti.className = 'vtitle'; ti.textContent = v.title;
    const me = document.createElement('div');
    me.className = 'vmeta';
    me.textContent = t('vmeta', {
      date: fmtDateFull(v.createdAt),
      size: (v.size / 1048576).toFixed(1),
      dur: fmtTime((v.durationMs || 0) / 1000)
    });
    const acts = document.createElement('div');
    acts.className = 'vactions';
    const mk = (label, cls, fn) => {
      const b = document.createElement('button');
      b.className = 'icobtn' + (cls ? ' ' + cls : '');
      b.textContent = label;
      b.addEventListener('click', (e) => { e.stopPropagation(); fn(); });
      return b;
    };
    acts.appendChild(mk(t('videos.share'), '', () => shareVideo(v)));
    acts.appendChild(mk(t('videos.save'), '', () => downloadVideo(v)));
    acts.appendChild(mk(t('videos.delete'), 'danger', () => deleteVideo(v)));
    body.appendChild(ti); body.appendChild(me); body.appendChild(acts);
    card.appendChild(thumb); card.appendChild(body);
    grid.appendChild(card);
  }
}
async function shareVideo(rec) {
  try {
    const ext = rec.ext || 'mp4';
    const file = new File([rec.blob], rec.name, { type: 'video/' + ext });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: rec.title, text: rec.title });
      return;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return;
  }
  downloadVideo(rec);
}
function downloadVideo(rec) {
  const url = URL.createObjectURL(rec.blob);
  const a = document.createElement('a');
  a.href = url; a.download = rec.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
async function deleteVideo(rec) {
  const ok = await confirmDlg(t('confirm.videoTitle'), t('confirm.videoBody'));
  if (!ok) return;
  await db.deleteVideo(rec.id);
  state.videos = state.videos.filter(v => v.id !== rec.id);
  renderVideos();
  if (!byId('playerOverlay').hidden) closePlayer();
  toast(t('toast.deleted'));
}
async function importExistingVideo(file) {
  if (!file) return;
  try {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata'; v.muted = true; v.src = url;
    await new Promise((res, rej) => {
      v.onloadedmetadata = res;
      v.onerror = () => rej(new Error('metadata'));
      setTimeout(() => rej(new Error('timeout')), 15000);
    });
    let thumb = null;
    try {
      await new Promise((res) => {
        v.onseeked = res;
        v.currentTime = Math.min(1.2, Math.max(0.1, (v.duration || 2) * 0.3));
        setTimeout(res, 4000);
      });
      const cw = 480, ch = Math.max(2, Math.round(480 * (v.videoHeight / Math.max(1, v.videoWidth))));
      const c = document.createElement('canvas');
      c.width = cw; c.height = ch;
      c.getContext('2d').drawImage(v, 0, 0, cw, ch);
      thumb = await new Promise((r) => c.toBlob((b) => r(b || null), 'image/jpeg', 0.72));
    } catch (e) { }
    URL.revokeObjectURL(url);
    const m = file.name.match(/\.([^.]+)$/);
    const ext = (m && m[1]) || 'mp4';
    const rec = {
      id: uid(), title: file.name.replace(/\.[^.]+$/, ''), name: file.name,
      createdAt: Date.now(), blob: file,
      width: v.videoWidth || 0, height: v.videoHeight || 0,
      durationMs: Math.round((v.duration || 0) * 1000),
      size: file.size, thumb, source: 'imported', ext
    };
    await db.addVideo(rec);
    state.videos.unshift(rec);
    renderVideos();
    toast(t('toast.imported'));
  } catch (e) {
    toast(t('toast.badFile'), 'err');
  }
}

/* ================= player ================= */
let playerRec = null, playerURL = null;
function openPlayer(rec) {
  playerRec = rec;
  if (playerURL) URL.revokeObjectURL(playerURL);
  playerURL = URL.createObjectURL(rec.blob);
  const v = byId('playerVideo');
  v.src = playerURL;
  byId('playerTitle').textContent = rec.title;
  byId('playerMeta').textContent = t('vmeta', {
    date: fmtDateFull(rec.createdAt),
    size: (rec.size / 1048576).toFixed(1),
    dur: fmtTime((rec.durationMs || 0) / 1000)
  });
  byId('playerOverlay').hidden = false;
  v.play().catch(() => { });
}
function closePlayer() {
  byId('playerOverlay').hidden = true;
  const v = byId('playerVideo');
  v.pause(); v.removeAttribute('src'); v.load();
  if (playerURL) { URL.revokeObjectURL(playerURL); playerURL = null; }
  playerRec = null;
}

/* ================= confirm dialog ================= */
let confirmRes = null;
function confirmDlg(title, body) {
  return new Promise((res) => {
    byId('confirmTitle').textContent = title;
    byId('confirmBody').textContent = body;
    byId('confirmOverlay').hidden = false;
    confirmRes = res;
  });
}
function confirmAnswer(ok) {
  byId('confirmOverlay').hidden = true;
  if (confirmRes) { const r = confirmRes; confirmRes = null; r(ok); }
}

/* ================= i18n / selects ================= */
function fillSelects() {
  const sizeSel = byId('setSize');
  const camSel = byId('setCamera');
  const speedSel = byId('setSpeed');
  const mapSel = byId('setMapStyle');
  const langSel = byId('setLang');
  const fill = (sel, entries, current) => {
    sel.innerHTML = '';
    for (const [val, label] of entries) {
      const o = document.createElement('option');
      o.value = val; o.textContent = label;
      if (val === current) o.selected = true;
      sel.appendChild(o);
    }
  };
  fill(sizeSel, [['portrait', t('size.portrait')], ['portrait-hd', t('size.portraitHd')], ['landscape', t('size.landscape')], ['square', t('size.square')]], state.settings.size);
  fill(camSel, [['follow', t('cam.follow')], ['cinematic', t('cam.cinematic')], ['overview', t('cam.overview')]], state.settings.camera);
  fill(speedSel, [['slow', t('speed.slow')], ['normal', t('speed.normal')], ['fast', t('speed.fast')]], state.settings.speed);
  fill(mapSel, [['standard', t('map.standard')], ['dark', t('map.dark')], ['clean', t('map.clean')]], state.settings.mapStyle);
  fill(langSel, LANGS.map(([v, l]) => [v, l]), state.settings.lang);
  byId('setShowInfo').checked = !!state.settings.showInfo;
  byId('setEndZoom').checked = !!state.settings.endZoom;
}
function applyI18n() {
  document.documentElement.lang = LANG;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  fillSelects();
  if (state.trip) showTripSummary();
  updateRangeSummary();
  updatePreviewMeta();
  updateAttrib();
  renderVideos();
  if (state.plan) renderPreview();
}
function onLanguageChange(lang) {
  LANG = lang;
  state.settings.lang = lang;
  saveSettings();
  applyI18n();
}

/* ================= trip loading ================= */
function showTripSummary() {
  if (!state.trip) return;
  byId('tripSummary').textContent = t('trip.summary', {
    n: state.trip.points.length.toLocaleString(),
    from: fmtDay(state.trip.minT),
    to: fmtDay(state.trip.maxT)
  });
}
function setTrip(trip, fileName) {
  const pts = extractPoints(trip);
  if (!pts.length) { toast(t('toast.badFile'), 'err'); return false; }
  pts.sort((a, b) => a.t - b.t);
  state.trip = { points: pts, minT: pts[0].t, maxT: pts[pts.length - 1].t, fileName: fileName || '' };
  state.range = null; state.route = null; state.plan = null;
  setStep(1);
  byId('importCard').hidden = true;
  byId('tripCard').hidden = false;
  byId('helpCard').removeAttribute('open');
  showTripSummary();
  return true;
}
async function onFile(file) {
  if (!file) return;
  try {
    let text;
    if (/\.zip$/i.test(file.name) || (file.type && file.type.includes('zip'))) {
      if (typeof JSZip === 'undefined') throw new Error('no jszip');
      const zip = await JSZip.loadAsync(file);
      let entry = zip.file(/timeline.*\.json$/i)[0] || zip.file(/location.*\.json$/i)[0] || zip.file(/\.json$/i)[0];
      if (!entry) throw new Error('no json in zip');
      text = await entry.async('string');
    } else {
      text = await file.text();
    }
    setTrip(JSON.parse(text), file.name);
  } catch (e) {
    console.error(e);
    toast(t('toast.badFile'), 'err');
  }
}
function loadSample() {
  if (window.TRIPREEL_SAMPLE) setTrip(window.TRIPREEL_SAMPLE, 'sample-trip.json');
}

/* ================= dates step ================= */
function initDatesPanel() {
  const trip = state.trip;
  if (state._datesInitedFor === trip) return; // keep user's picks when revisiting
  state._datesInitedFor = trip;
  const from = byId('dateFrom'), to = byId('dateTo');
  from.min = to.min = dstrLocal(trip.minT);
  from.max = to.max = dstrLocal(trip.maxT);
  from.value = dstrLocal(trip.minT);
  to.value = dstrLocal(trip.maxT);
  updateRangeSummary();
}
function currentRange() {
  const from = byId('dateFrom').value, to = byId('dateTo').value;
  if (!from || !to) return null;
  const s = parseDstr(from), e = parseDstr(to);
  if (s > e) return null;
  return { start: s, end: dayEnd(e) };
}
function updateRangeSummary() {
  const el = byId('rangeSummary');
  if (!el || !state.trip) return;
  const r = currentRange();
  if (!r) { el.textContent = ''; return; }
  const route = buildRoute(state.trip, r);
  if (!route || !route.pts.length) { el.textContent = ''; return; }
  state._liveRoute = route;
  el.textContent = t('range.summary', {
    n: route.pts.length.toLocaleString(),
    km: route.totalKm >= 100 ? Math.round(route.totalKm) : route.totalKm.toFixed(1)
  });
}

/* ================= navigation ================= */
function setStep(n) {
  state.step = n;
  byId('panel-import').hidden = n !== 1;
  byId('panel-dates').hidden = n !== 2;
  byId('panel-preview').hidden = n !== 3;
  document.querySelectorAll('#stepChips .step').forEach((el) => {
    const s = +el.dataset.step;
    el.classList.toggle('active', s === n);
    el.classList.toggle('done', s < n);
    el.classList.toggle('clickable', (s === 2 && !!state.trip) || (s === 3 && !!state.plan) || (s === 1));
  });
  if (n === 2) initDatesPanel();
  if (n === 3) {
    byId('titleInput').value = state._videoTitle || '';
    updatePreviewMeta();
    updateAttrib();
    fitMapwrap(); // panel is visible now, so sizes are real
    renderPreview();
    setPlaying(true);
  }
}
function goPreview() {
  const r = currentRange();
  if (!r) return;
  const route = buildRoute(state.trip, r);
  if (!route || !route.pts.length) { toast(t('toast.noPoints'), 'err'); return; }
  state.range = r;
  state.route = route;
  buildPlan();
  state._videoTitle = t('end.trip') + ' · ' + dateRangeLabel(r.start, r.end);
  setStep(3);
}
function setView(name) {
  state.view = name;
  byId('view-create').hidden = name !== 'create';
  byId('view-videos').hidden = name !== 'videos';
  byId('view-settings').hidden = name !== 'settings';
  document.querySelectorAll('#tabbar .tab').forEach((el) => el.classList.toggle('active', el.dataset.view === name));
  window.scrollTo(0, 0);
}

/* ================= settings ================= */
function onVideoSettingChanged() {
  if (state.plan) {
    buildPlan();
    renderPreview();
    if (state.step === 3 && state.view === 'create') { updatePreviewMeta(); updateAttrib(); }
  }
}

/* ================= wiring ================= */
function wireUI() {
  // tabs
  document.querySelectorAll('#tabbar .tab').forEach((el) => {
    el.addEventListener('click', () => setView(el.dataset.view));
  });
  // step chips
  document.querySelectorAll('#stepChips .step').forEach((el) => {
    el.addEventListener('click', () => {
      const s = +el.dataset.step;
      if (s === 1) setStep(1);
      else if (s === 2 && state.trip) setStep(2);
      else if (s === 3 && state.plan) setStep(3);
    });
  });
  // file input + dropzone
  byId('fileInput').addEventListener('change', (e) => { onFile(e.target.files[0]); e.target.value = ''; });
  const dz = byId('dropzone');
  ['dragenter', 'dragover'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('drag'); }));
  dz.addEventListener('drop', (e) => { const f = e.dataTransfer && e.dataTransfer.files[0]; if (f) onFile(f); });
  byId('btnSample').addEventListener('click', loadSample);
  byId('btnReimport').addEventListener('click', () => {
    state.trip = null; state.route = null; state.plan = null;
    byId('tripCard').hidden = true;
    byId('importCard').hidden = false;
    byId('helpCard').setAttribute('open', '');
    setStep(1);
  });
  byId('btnToDates').addEventListener('click', () => setStep(2));
  byId('btnBackImport').addEventListener('click', () => setStep(1));
  // dates
  byId('dateFrom').addEventListener('change', updateRangeSummary);
  byId('dateTo').addEventListener('change', updateRangeSummary);
  byId('presetAll').addEventListener('click', () => {
    byId('dateFrom').value = dstrLocal(state.trip.minT);
    byId('dateTo').value = dstrLocal(state.trip.maxT);
    updateRangeSummary();
  });
  byId('presetFirst').addEventListener('click', () => {
    byId('dateFrom').value = dstrLocal(state.trip.minT);
    byId('dateTo').value = dstrLocal(state.trip.minT);
    updateRangeSummary();
  });
  byId('presetLast').addEventListener('click', () => {
    byId('dateFrom').value = dstrLocal(state.trip.maxT);
    byId('dateTo').value = dstrLocal(state.trip.maxT);
    updateRangeSummary();
  });
  byId('btnToPreview').addEventListener('click', goPreview);
  byId('btnBackDates').addEventListener('click', () => setStep(2));
  // preview controls
  byId('titleInput').addEventListener('input', (e) => { state._videoTitle = e.target.value.trim() || state._videoTitle; });
  byId('btnPlay').addEventListener('click', () => setPlaying(!state.preview.playing));
  byId('btnRestart').addEventListener('click', () => { state.preview.t = 0; renderPreview(); setPlaying(true); });
  byId('scrub').addEventListener('input', (e) => {
    const P = state.plan;
    if (!P) return;
    setPlaying(false);
    state.preview.t = (e.target.value / 1000) * (P.Ntotal - 1) / FPS;
    renderPreview();
  });
  byId('btnRecord').addEventListener('click', () => {
    const title = byId('titleInput').value.trim() || (state._videoTitle || t('end.trip'));
    generateVideo(title);
  });
  // videos
  byId('importVideoInput').addEventListener('change', (e) => { importExistingVideo(e.target.files[0]); e.target.value = ''; });
  // player
  byId('btnClosePlayer').addEventListener('click', closePlayer);
  byId('playerOverlay').addEventListener('click', (e) => { if (e.target === byId('playerOverlay')) closePlayer(); });
  byId('btnPlayerShare').addEventListener('click', () => { if (playerRec) shareVideo(playerRec); });
  byId('btnPlayerSave').addEventListener('click', () => { if (playerRec) downloadVideo(playerRec); });
  byId('btnPlayerDelete').addEventListener('click', async () => { if (playerRec) await deleteVideo(playerRec); });
  // confirm
  byId('btnConfirmNo').addEventListener('click', () => confirmAnswer(false));
  byId('btnConfirmYes').addEventListener('click', () => confirmAnswer(true));
  // settings
  byId('setSize').addEventListener('change', (e) => { state.settings.size = e.target.value; saveSettings(); onVideoSettingChanged(); });
  byId('setCamera').addEventListener('change', (e) => { state.settings.camera = e.target.value; saveSettings(); onVideoSettingChanged(); });
  byId('setSpeed').addEventListener('change', (e) => { state.settings.speed = e.target.value; saveSettings(); onVideoSettingChanged(); });
  byId('setMapStyle').addEventListener('change', (e) => { state.settings.mapStyle = e.target.value; saveSettings(); onVideoSettingChanged(); updateAttrib(); });
  byId('setShowInfo').addEventListener('change', (e) => { state.settings.showInfo = e.target.checked; saveSettings(); onVideoSettingChanged(); });
  byId('setEndZoom').addEventListener('change', (e) => { state.settings.endZoom = e.target.checked; saveSettings(); onVideoSettingChanged(); });
  byId('setLang').addEventListener('change', (e) => onLanguageChange(e.target.value));
  byId('btnWipe').addEventListener('click', async () => {
    const ok = await confirmDlg(t('confirm.wipeTitle'), t('confirm.wipeBody'));
    if (!ok) return;
    await db.clear();
    toast(t('toast.wiped'));
    setTimeout(() => location.reload(), 700);
  });
  window.addEventListener('resize', fitMapwrap);
  window.addEventListener('online', updateAttrib);
  window.addEventListener('offline', updateAttrib);
}

/* ================= boot ================= */
async function boot() {
  const dbOk = await db.init();
  if (!dbOk && !state.sessionOnlyWarned) {
    state.sessionOnlyWarned = true;
    toast(t('toast.sessionOnly'), 'err', 5000);
  }
  const saved = await db.getKV('settings');
  if (saved) Object.assign(state.settings, saved);
  LANG = state.settings.lang || 'en';
  wireUI();
  applyI18n();
  const vids = await db.listVideos();
  state.videos = vids.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  renderVideos();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => { });
  }
}
if (typeof document !== 'undefined' && document.getElementById('app')) boot();

/* node test exports (ignored in the browser) */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    extractPoints, buildRoute, mercX, mercY, haversineKm, fitCamera, buildCamPath, catmullRom, routeAnimSeconds, SIZES, SPEEDS,
    _internal: {
      state, setTrip, goPreview, setStep, renderPreview, frameState, drawFrame, buildPlan,
      updateRangeSummary, initDatesPanel, currentRange, onLanguageChange, t, chooseBackend
    }
  };
}
