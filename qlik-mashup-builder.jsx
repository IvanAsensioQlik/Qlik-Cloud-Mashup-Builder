import React, { useState, useRef, useEffect, useContext, createContext } from 'react';
import {
  Menu, ChevronLeft, ChevronRight, Filter, Info, Maximize2, Plus, Trash2,
  Download, ArrowUp, ArrowDown, Smartphone,
  RotateCw, Settings, ChevronDown, Layers, Globe, X, Save, Upload, RefreshCw
} from 'lucide-react';

const AUTOSAVE_KEY = 'qlik-mashup-builder:autosave-v1';
const PROJECT_FORMAT_VERSION = 1;
function loadAutosave() {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.tabs) || data.tabs.length === 0) return null;
    return data;
  } catch (e) { return null; }
}
function serializeProject(state) {
  return JSON.stringify({
    version: PROJECT_FORMAT_VERSION, savedAt: new Date().toISOString(),
    lang: state.lang, defaultPresetKey: state.defaultPresetKey, frame: state.frame, landscape: state.landscape,
    global: state.global, header: state.header, tabs: state.tabs, selectedId: state.selectedId
  }, null, 2);
}
function parseProjectFile(text) {
  const data = JSON.parse(text);
  if (!data || !Array.isArray(data.tabs) || data.tabs.length === 0) throw new Error('invalid');
  return data;
}
function sanitizeFileName(name) {
  const cleaned = (name || '').trim().replace(/[^a-zA-Z0-9-_ ]/g, '').trim();
  return cleaned || 'mashup-project';
}

// ---------------------------------------------------------------------------
// I18N
// ---------------------------------------------------------------------------
const LANGS = [
  { key: 'es', label: 'Español' }, { key: 'en', label: 'English' },
  { key: 'de', label: 'Deutsch' }, { key: 'it', label: 'Italiano' }, { key: 'fr', label: 'Français' },
  { key: 'pt', label: 'Português' }
];
const I18N = {
  es: {
    appAuth: 'App y Auth', headerBtn: 'Cabecera', exportBtn: 'Exportar',
    authType: 'Tipo de autenticación', anonymous: 'Anónima', appIdDefault: 'App ID (por defecto)',
    navGlobalLabel: 'Navegación (todas las pestañas)', navFooter: 'Pie de navegación', navHiddenTop: 'Panel oculto superior',
    fontGeneral: 'Fuente general', minFontSize: 'Tamaño mínimo de texto', logoPosition: 'Posición del logo',
    left: 'Izquierda', center: 'Centro', right: 'Derecha', logoLabel: 'Logo',
    extraImageLabel: 'Imagen adicional en cabecera', uploadBtn: 'Subir',
    textBefore: 'Texto antes del logo', textAfter: 'Texto después del logo',
    defaultPalette: 'Paleta por defecto', paletteAppliesNote: 'Se aplica también a la pestaña que estás viendo.',
    tabsLabel: 'Pestañas', namePlaceholder: 'Nombre...', addHome: 'Home', addAnalytics: 'Analytics',
    portrait: 'Portrait', landscape: 'Landscape',
    generalSectionTitle: 'General (info e icono de pie)', infoIconToggle: 'Icono de información (i)',
    infoPopupText: 'Texto del popup de información', infoPopupPlaceholder: 'Explicación sobre la app que verá el usuario...',
    footerIconLabel: 'Icono de esta pestaña en el pie / menú',
    paletteThisTab: 'Paleta de esta pestaña', referenceVisual: 'Referencia visual',
    referenceImageLabel: 'Imagen de ejemplo (solo referencia, no se exporta)',
    headerMedia: 'Media de cabecera', mediaType: 'Tipo de media', image: 'Imagen', video: 'Vídeo',
    urlVideo: 'URL de vídeo', urlPhoto: 'URL de foto', blockHeight: 'Altura del bloque',
    videoNote: 'El vídeo se centra y recorta (cover) dentro de este espacio, sin invadir la cabecera.',
    titleSubtitle: 'Título y subtítulo', titleLabel: 'Título', subtitleLabel: 'Subtítulo',
    textPosition: 'Posición del texto', topLeft: 'Arriba izquierda', topCenter: 'Arriba centro',
    posCenter: 'Centro', bottomLeft: 'Abajo izquierda', bottomCenter: 'Abajo centro',
    extraTextLabel: 'Texto extra (opcional)', navExtrasTitle: 'Extras de navegación en esta pestaña',
    shortcutCardsToggle: 'Tarjetas numeradas de acceso a pestañas', nextIconToggle: 'Icono de ir a la siguiente pestaña',
    commentsTitle: 'Comentarios / cambios no previstos', commentsPlaceholder: 'Describe cualquier ajuste adicional para esta pestaña...',
    commentsNote: 'Se incluirá como comentario HTML junto a esta pestaña en el index.html exportado.',
    dataSourceTitle: 'Origen de datos', useOwnAppId: 'Usar un App ID distinto al global', ownAppIdLabel: 'App ID de esta pestaña',
    navTabTitle: 'Navegación de la pestaña', filterIconToggle: 'Icono de panel de filtrado (en la cabecera)',
    filterObjectIdLabel: 'ID objeto de selecciones (opcional)', navPrevToggle: 'Icono ir a pestaña anterior', navNextToggle: 'Icono ir a pestaña siguiente',
    rowsSectionTitle: 'Filas y objetos', addRowBtn: 'Añadir fila',
    rowsHintNote: 'Los objetos de una misma fila se alinean automáticamente a la misma altura; si no caben en la anchura disponible, se colocan uno debajo del otro.',
    bgColorTab: 'Color de fondo de la pestaña',
    rowLabel: 'Fila', useHeightPctToggle: 'Ocupar % de la pantalla', rowHeightPctSuffix: '% de la pantalla disponible',
    minHeightLabel: 'Altura mínima (px) — siempre se respeta como suelo',
    rowHeightNote: 'El 100% llega hasta el pie/última zona visible, sin pisar cabecera, pie ni la barra de navegación <>.',
    addObjectToRowBtn: 'Añadir objeto a esta fila',
    objectLabel: 'Objeto', objectIdLabel: 'Object ID (Qlik)', widthInRowLabel: 'Ancho en la fila',
    isMapExtToggle: 'Es mapa o extensión (classic/chart)', borderToggle: 'Con borde',
    borderColorLabel: 'Color del borde', bgColorObjLabel: 'Color de fondo del objeto',
    expandableToggle: 'Ampliable a pantalla completa', minimizedToggle: 'Minimizado por defecto',
    minTitleLabel: 'Título (minimizado)', minDescLabel: 'Descripción (minimizado)',
    addObjectsHint: 'Añade objetos desde el panel derecho', noObjectId: 'Sin object-id', fullscreenLabel: '(pantalla completa)',
    filtersTitle: 'Filtros', filterPanelHint: 'Panel de filtrado (añade un object-id opcional)',
    selectionsPanelLabel: 'Panel de selecciones', noInfoYet: 'Sin descripción todavía.',
    minimizedWidthNote: 'Los objetos minimizados ocupan siempre el 100% del ancho y se colocan uno debajo del otro.',
    minimizedBgNote: 'Este color solo se aplica al menú minimizado; una vez ampliado, el objeto usa el diseño definido en Qlik, sin color de fondo.',
    footerIconColorLabel: 'Color de los iconos de navegación', filterButtonsLabel: 'Botones del panel de filtros (opcional, hasta 3, 50px de alto)', filterButtonLabel: 'Botón',
    defaultObjectBgLabel: 'Color de fondo por defecto de los objetos', filterPanelWidthLabel: 'Anchura del panel de filtros', filterButtonsNote: 'Los botones aparecen en la cabecera, a la izquierda del icono de filtros, en todas las pestañas excepto Home.',
    minimizedTextColorLabel: 'Color de la fuente (minimizado)', generateOauthCallbackLabel: 'Generar oauth-callback.html', aboutAppTitle: 'Sobre esta app',
    headerTextColorLabel: 'Color de texto e iconos de la cabecera superior', extraTextOverPhotoToggle: 'Mostrar el texto extra sobre la foto', extraTextColorLabel: 'Color del texto extra',
    titleColorLabel: 'Color del título y flechas de navegación', rowGapLabel: 'Separación entre filas', topBarBgColorLabel: 'Color de fondo de la cabecera superior',
    welcomeFooterToggle: 'Incluir pie en esta pestaña', welcomeFooterTextLabel: 'Texto del pie', hiddenMenuTitle: 'Menú', navHiddenTopStyleImproved: '',
    oauthZipNote: 'Se descargará como mashup-export.zip (index.html + oauth-callback.html), ya que los navegadores bloquean una segunda descarga automática.',
    homeTabDefaultName: 'Inicio', welcomeDefaultTitle: 'Bienvenido', welcomeDefaultSubtitle: 'Explora tus datos desde el móvil', newTabDefaultName: 'Nueva pestaña', tabDefaultNamePrefix: 'Pestaña',
    objectShadowToggle: 'Sombra suave',
    activeIconColorLabel: 'Color del icono activo', pageTitleLabel: 'Título de la página (title)', faviconLabel: 'Favicon (URL)', importCssLabel: 'Importar CSS externo (URL)',
    saveProjectLabel: 'Guardar proyecto (.json)', loadProjectLabel: 'Cargar proyecto (.json)', projectNamePlaceholder: 'nombre-proyecto',
    projectLoadedNote: 'Proyecto cargado correctamente.', projectLoadErrorNote: 'No se pudo leer el archivo: no es un proyecto válido.',
    autosaveRestoredNote: 'Se restauró tu proyecto guardado automáticamente.',
    rowAllMinimizedNote: 'Esta fila solo contiene objetos minimizados: se ajusta siempre a su contenido y no usa altura % ni altura mínima.'
  },
  en: {
    appAuth: 'App & Auth', headerBtn: 'Header', exportBtn: 'Export',
    authType: 'Authentication type', anonymous: 'Anonymous', appIdDefault: 'App ID (default)',
    navGlobalLabel: 'Navigation (all tabs)', navFooter: 'Bottom navigation', navHiddenTop: 'Hidden top panel',
    fontGeneral: 'General font', minFontSize: 'Minimum text size', logoPosition: 'Logo position',
    left: 'Left', center: 'Center', right: 'Right', logoLabel: 'Logo',
    extraImageLabel: 'Additional header image', uploadBtn: 'Upload',
    textBefore: 'Text before logo', textAfter: 'Text after logo',
    defaultPalette: 'Default palette', paletteAppliesNote: "Also applies to the tab you're currently viewing.",
    tabsLabel: 'Tabs', namePlaceholder: 'Name...', addHome: 'Home', addAnalytics: 'Analytics',
    portrait: 'Portrait', landscape: 'Landscape',
    generalSectionTitle: 'General (info & footer icon)', infoIconToggle: 'Information icon (i)',
    infoPopupText: 'Information popup text', infoPopupPlaceholder: 'Explanation about the app the user will see...',
    footerIconLabel: 'Icon for this tab in the footer / menu',
    paletteThisTab: "This tab's palette", referenceVisual: 'Visual reference',
    referenceImageLabel: 'Example image (reference only, not exported)',
    headerMedia: 'Header media', mediaType: 'Media type', image: 'Image', video: 'Video',
    urlVideo: 'Video URL', urlPhoto: 'Photo URL', blockHeight: 'Block height',
    videoNote: 'The video is centered and cropped (cover) within this space, without covering the header.',
    titleSubtitle: 'Title and subtitle', titleLabel: 'Title', subtitleLabel: 'Subtitle',
    textPosition: 'Text position', topLeft: 'Top left', topCenter: 'Top center',
    posCenter: 'Center', bottomLeft: 'Bottom left', bottomCenter: 'Bottom center',
    extraTextLabel: 'Extra text (optional)', navExtrasTitle: 'Navigation extras on this tab',
    shortcutCardsToggle: 'Numbered shortcut cards to tabs', nextIconToggle: 'Icon to go to the next tab',
    commentsTitle: 'Comments / unplanned changes', commentsPlaceholder: 'Describe any additional adjustment for this tab...',
    commentsNote: 'It will be included as an HTML comment next to this tab in the exported index.html.',
    dataSourceTitle: 'Data source', useOwnAppId: 'Use a different App ID than the global one', ownAppIdLabel: "This tab's App ID",
    navTabTitle: 'Tab navigation', filterIconToggle: 'Filter panel icon (in the header)',
    filterObjectIdLabel: 'Selections object ID (optional)', navPrevToggle: 'Icon to go to previous tab', navNextToggle: 'Icon to go to next tab',
    rowsSectionTitle: 'Rows and objects', addRowBtn: 'Add row',
    rowsHintNote: "Objects in the same row are automatically aligned to the same height; if they don't fit the available width, they stack vertically.",
    bgColorTab: 'Tab background color',
    rowLabel: 'Row', useHeightPctToggle: 'Use % of the screen', rowHeightPctSuffix: '% of the available screen',
    minHeightLabel: 'Minimum height (px) — always respected as a floor',
    rowHeightNote: '100% reaches down to the footer / last visible area, without covering the header, footer, or the <> navigation bar.',
    addObjectToRowBtn: 'Add object to this row',
    objectLabel: 'Object', objectIdLabel: 'Object ID (Qlik)', widthInRowLabel: 'Width in row',
    isMapExtToggle: 'Is a map or extension (classic/chart)', borderToggle: 'With border',
    borderColorLabel: 'Border color', bgColorObjLabel: 'Object background color',
    expandableToggle: 'Expandable to full screen', minimizedToggle: 'Minimized by default',
    minTitleLabel: 'Title (minimized)', minDescLabel: 'Description (minimized)',
    addObjectsHint: 'Add objects from the right panel', noObjectId: 'No object-id', fullscreenLabel: '(full screen)',
    filtersTitle: 'Filters', filterPanelHint: 'Filter panel (add an optional object-id)',
    selectionsPanelLabel: 'Selections panel', noInfoYet: 'No description yet.',
    minimizedWidthNote: 'Minimized objects always take 100% of the width and stack one below the other.',
    minimizedBgNote: 'This color only applies to the minimized menu; once expanded, the object uses the design defined in Qlik, with no background color.',
    footerIconColorLabel: 'Navigation icons color', filterButtonsLabel: 'Filter panel buttons (optional, up to 3, 50px tall)', filterButtonLabel: 'Button',
    defaultObjectBgLabel: 'Default background color for objects', filterPanelWidthLabel: 'Filter panel width', filterButtonsNote: 'The buttons appear in the header, to the left of the filter icon, on every tab except Home.',
    minimizedTextColorLabel: 'Font color (minimized)', generateOauthCallbackLabel: 'Generate oauth-callback.html', aboutAppTitle: 'About this app',
    headerTextColorLabel: 'Top bar text & icon color', extraTextOverPhotoToggle: 'Show extra text over the photo', extraTextColorLabel: 'Extra text color',
    titleColorLabel: 'Title & navigation arrows color', rowGapLabel: 'Spacing between rows', topBarBgColorLabel: 'Top bar background color',
    welcomeFooterToggle: 'Include a footer on this tab', welcomeFooterTextLabel: 'Footer text', hiddenMenuTitle: 'Menu', navHiddenTopStyleImproved: '',
    oauthZipNote: 'It will download as mashup-export.zip (index.html + oauth-callback.html), since browsers block a second automatic download.',
    homeTabDefaultName: 'Home', welcomeDefaultTitle: 'Welcome', welcomeDefaultSubtitle: 'Explore your data from your mobile', newTabDefaultName: 'New tab', tabDefaultNamePrefix: 'Tab',
    objectShadowToggle: 'Soft shadow',
    activeIconColorLabel: 'Active icon color', pageTitleLabel: 'Page title (<title>)', faviconLabel: 'Favicon (URL)', importCssLabel: 'Import external CSS (URL)',
    saveProjectLabel: 'Save project (.json)', loadProjectLabel: 'Load project (.json)', projectNamePlaceholder: 'project-name',
    projectLoadedNote: 'Project loaded successfully.', projectLoadErrorNote: 'Could not read the file: not a valid project.',
    autosaveRestoredNote: 'Your saved project was restored automatically.',
    rowAllMinimizedNote: "This row only contains minimized objects: it always fits its content and doesn't use % height or minimum height."
  },
  de: {
    appAuth: 'App & Auth', headerBtn: 'Kopfzeile', exportBtn: 'Exportieren',
    authType: 'Authentifizierungstyp', anonymous: 'Anonym', appIdDefault: 'App-ID (Standard)',
    navGlobalLabel: 'Navigation (alle Tabs)', navFooter: 'Fußnavigation', navHiddenTop: 'Verstecktes oberes Panel',
    fontGeneral: 'Allgemeine Schriftart', minFontSize: 'Minimale Textgröße', logoPosition: 'Logo-Position',
    left: 'Links', center: 'Mitte', right: 'Rechts', logoLabel: 'Logo',
    extraImageLabel: 'Zusätzliches Bild in der Kopfzeile', uploadBtn: 'Hochladen',
    textBefore: 'Text vor dem Logo', textAfter: 'Text nach dem Logo',
    defaultPalette: 'Standardpalette', paletteAppliesNote: 'Gilt auch für den aktuell angezeigten Tab.',
    tabsLabel: 'Tabs', namePlaceholder: 'Name...', addHome: 'Home', addAnalytics: 'Analytics',
    portrait: 'Hochformat', landscape: 'Querformat',
    generalSectionTitle: 'Allgemein (Info & Fußzeilen-Symbol)', infoIconToggle: 'Info-Symbol (i)',
    infoPopupText: 'Text des Info-Popups', infoPopupPlaceholder: 'Erklärung zur App, die der Nutzer sieht...',
    footerIconLabel: 'Symbol für diesen Tab in Fußzeile/Menü',
    paletteThisTab: 'Palette dieses Tabs', referenceVisual: 'Visuelle Referenz',
    referenceImageLabel: 'Beispielbild (nur Referenz, wird nicht exportiert)',
    headerMedia: 'Kopfzeilen-Medien', mediaType: 'Medientyp', image: 'Bild', video: 'Video',
    urlVideo: 'Video-URL', urlPhoto: 'Foto-URL', blockHeight: 'Blockhöhe',
    videoNote: 'Das Video wird zentriert und zugeschnitten (cover), ohne die Kopfzeile zu verdecken.',
    titleSubtitle: 'Titel und Untertitel', titleLabel: 'Titel', subtitleLabel: 'Untertitel',
    textPosition: 'Textposition', topLeft: 'Oben links', topCenter: 'Oben Mitte',
    posCenter: 'Mitte', bottomLeft: 'Unten links', bottomCenter: 'Unten Mitte',
    extraTextLabel: 'Zusätzlicher Text (optional)', navExtrasTitle: 'Navigations-Extras auf diesem Tab',
    shortcutCardsToggle: 'Nummerierte Kurzwahlkarten zu Tabs', nextIconToggle: 'Symbol zum nächsten Tab',
    commentsTitle: 'Kommentare / ungeplante Änderungen', commentsPlaceholder: 'Beschreiben Sie zusätzliche Anpassungen für diesen Tab...',
    commentsNote: 'Wird als HTML-Kommentar bei diesem Tab in der exportierten index.html eingefügt.',
    dataSourceTitle: 'Datenquelle', useOwnAppId: 'Eine andere App-ID als die globale verwenden', ownAppIdLabel: 'App-ID dieses Tabs',
    navTabTitle: 'Tab-Navigation', filterIconToggle: 'Filter-Panel-Symbol (in der Kopfzeile)',
    filterObjectIdLabel: 'Objekt-ID der Auswahl (optional)', navPrevToggle: 'Symbol für vorherigen Tab', navNextToggle: 'Symbol für nächsten Tab',
    rowsSectionTitle: 'Zeilen und Objekte', addRowBtn: 'Zeile hinzufügen',
    rowsHintNote: 'Objekte in derselben Zeile werden automatisch auf dieselbe Höhe ausgerichtet; passen sie nicht in die Breite, werden sie übereinander angeordnet.',
    bgColorTab: 'Hintergrundfarbe des Tabs',
    rowLabel: 'Zeile', useHeightPctToggle: '% des Bildschirms nutzen', rowHeightPctSuffix: '% des verfügbaren Bildschirms',
    minHeightLabel: 'Mindesthöhe (px) — wird immer als unterer Grenzwert eingehalten',
    rowHeightNote: '100 % reicht bis zur Fußzeile / letzten sichtbaren Zone, ohne Kopfzeile, Fußzeile oder die <>-Navigationsleiste zu verdecken.',
    addObjectToRowBtn: 'Objekt zu dieser Zeile hinzufügen',
    objectLabel: 'Objekt', objectIdLabel: 'Object ID (Qlik)', widthInRowLabel: 'Breite in der Zeile',
    isMapExtToggle: 'Ist eine Karte oder Erweiterung (classic/chart)', borderToggle: 'Mit Rahmen',
    borderColorLabel: 'Rahmenfarbe', bgColorObjLabel: 'Hintergrundfarbe des Objekts',
    expandableToggle: 'Auf Vollbild erweiterbar', minimizedToggle: 'Standardmäßig minimiert',
    minTitleLabel: 'Titel (minimiert)', minDescLabel: 'Beschreibung (minimiert)',
    addObjectsHint: 'Fügen Sie Objekte über das rechte Panel hinzu', noObjectId: 'Keine Objekt-ID', fullscreenLabel: '(Vollbild)',
    filtersTitle: 'Filter', filterPanelHint: 'Filterpanel (optionale Objekt-ID hinzufügen)',
    selectionsPanelLabel: 'Auswahlpanel', noInfoYet: 'Noch keine Beschreibung.',
    minimizedWidthNote: 'Minimierte Objekte nehmen immer 100 % der Breite ein und werden übereinander angeordnet.',
    minimizedBgNote: 'Diese Farbe gilt nur für das minimierte Menü; nach dem Erweitern verwendet das Objekt das in Qlik definierte Design ohne Hintergrundfarbe.',
    footerIconColorLabel: 'Farbe der Navigationssymbole', filterButtonsLabel: 'Schaltflächen des Filterpanels (optional, bis zu 3, 50px hoch)', filterButtonLabel: 'Schaltfläche',
    defaultObjectBgLabel: 'Standardhintergrundfarbe der Objekte', filterPanelWidthLabel: 'Breite des Filterpanels', filterButtonsNote: 'Die Schaltflächen erscheinen in der Kopfzeile, links vom Filtersymbol, auf allen Tabs außer Home.',
    minimizedTextColorLabel: 'Schriftfarbe (minimiert)', generateOauthCallbackLabel: 'oauth-callback.html erzeugen', aboutAppTitle: 'Über diese App',
    headerTextColorLabel: 'Text- und Symbolfarbe der oberen Leiste', extraTextOverPhotoToggle: 'Zusätzlichen Text über dem Foto anzeigen', extraTextColorLabel: 'Farbe des zusätzlichen Textes',
    titleColorLabel: 'Farbe von Titel und Navigationspfeilen', rowGapLabel: 'Abstand zwischen Zeilen', topBarBgColorLabel: 'Hintergrundfarbe der oberen Leiste',
    welcomeFooterToggle: 'Fußzeile auf diesem Tab einfügen', welcomeFooterTextLabel: 'Text der Fußzeile', hiddenMenuTitle: 'Menü', navHiddenTopStyleImproved: '',
    oauthZipNote: 'Wird als mashup-export.zip heruntergeladen (index.html + oauth-callback.html), da Browser einen zweiten automatischen Download blockieren.',
    homeTabDefaultName: 'Start', welcomeDefaultTitle: 'Willkommen', welcomeDefaultSubtitle: 'Entdecke deine Daten mobil', newTabDefaultName: 'Neuer Tab', tabDefaultNamePrefix: 'Tab',
    objectShadowToggle: 'Weicher Schatten',
    activeIconColorLabel: 'Farbe des aktiven Symbols', pageTitleLabel: 'Seitentitel (<title>)', faviconLabel: 'Favicon (URL)', importCssLabel: 'Externes CSS importieren (URL)',
    saveProjectLabel: 'Projekt speichern (.json)', loadProjectLabel: 'Projekt laden (.json)', projectNamePlaceholder: 'projektname',
    projectLoadedNote: 'Projekt erfolgreich geladen.', projectLoadErrorNote: 'Datei konnte nicht gelesen werden: kein gültiges Projekt.',
    autosaveRestoredNote: 'Ihr gespeichertes Projekt wurde automatisch wiederhergestellt.',
    rowAllMinimizedNote: 'Diese Zeile enthält nur minimierte Objekte: Sie passt sich immer ihrem Inhalt an und nutzt weder Höhe in % noch Mindesthöhe.'
  },
  it: {
    appAuth: 'App e Auth', headerBtn: 'Intestazione', exportBtn: 'Esporta',
    authType: 'Tipo di autenticazione', anonymous: 'Anonima', appIdDefault: 'App ID (predefinito)',
    navGlobalLabel: 'Navigazione (tutte le schede)', navFooter: 'Navigazione a piè di pagina', navHiddenTop: 'Pannello superiore nascosto',
    fontGeneral: 'Font generale', minFontSize: 'Dimensione minima del testo', logoPosition: 'Posizione del logo',
    left: 'Sinistra', center: 'Centro', right: 'Destra', logoLabel: 'Logo',
    extraImageLabel: "Immagine aggiuntiva nell'intestazione", uploadBtn: 'Carica',
    textBefore: 'Testo prima del logo', textAfter: 'Testo dopo il logo',
    defaultPalette: 'Tavolozza predefinita', paletteAppliesNote: 'Si applica anche alla scheda che stai visualizzando.',
    tabsLabel: 'Schede', namePlaceholder: 'Nome...', addHome: 'Home', addAnalytics: 'Analytics',
    portrait: 'Verticale', landscape: 'Orizzontale',
    generalSectionTitle: 'Generale (info e icona footer)', infoIconToggle: 'Icona informazioni (i)',
    infoPopupText: 'Testo del popup informativo', infoPopupPlaceholder: "Spiegazione sull'app che l'utente vedrà...",
    footerIconLabel: 'Icona di questa scheda nel footer/menu',
    paletteThisTab: 'Tavolozza di questa scheda', referenceVisual: 'Riferimento visivo',
    referenceImageLabel: 'Immagine di esempio (solo riferimento, non esportata)',
    headerMedia: "Media dell'intestazione", mediaType: 'Tipo di media', image: 'Immagine', video: 'Video',
    urlVideo: 'URL video', urlPhoto: 'URL foto', blockHeight: 'Altezza del blocco',
    videoNote: "Il video viene centrato e ritagliato (cover) in questo spazio, senza invadere l'intestazione.",
    titleSubtitle: 'Titolo e sottotitolo', titleLabel: 'Titolo', subtitleLabel: 'Sottotitolo',
    textPosition: 'Posizione del testo', topLeft: 'Alto sinistra', topCenter: 'Alto centro',
    posCenter: 'Centro', bottomLeft: 'Basso sinistra', bottomCenter: 'Basso centro',
    extraTextLabel: 'Testo extra (opzionale)', navExtrasTitle: 'Extra di navigazione in questa scheda',
    shortcutCardsToggle: 'Schede numerate di accesso alle schede', nextIconToggle: 'Icona per andare alla scheda successiva',
    commentsTitle: 'Commenti / modifiche non previste', commentsPlaceholder: 'Descrivi eventuali modifiche aggiuntive per questa scheda...',
    commentsNote: "Verrà incluso come commento HTML vicino a questa scheda nel file index.html esportato.",
    dataSourceTitle: 'Origine dati', useOwnAppId: 'Usa un App ID diverso da quello globale', ownAppIdLabel: 'App ID di questa scheda',
    navTabTitle: 'Navigazione della scheda', filterIconToggle: "Icona del pannello filtri (nell'intestazione)",
    filterObjectIdLabel: 'ID oggetto selezioni (opzionale)', navPrevToggle: 'Icona per andare alla scheda precedente', navNextToggle: 'Icona per andare alla scheda successiva',
    rowsSectionTitle: 'Righe e oggetti', addRowBtn: 'Aggiungi riga',
    rowsHintNote: "Gli oggetti nella stessa riga si allineano automaticamente alla stessa altezza; se non entrano nella larghezza disponibile, si dispongono uno sotto l'altro.",
    bgColorTab: 'Colore di sfondo della scheda',
    rowLabel: 'Riga', useHeightPctToggle: 'Occupa % dello schermo', rowHeightPctSuffix: '% dello schermo disponibile',
    minHeightLabel: 'Altezza minima (px) — sempre rispettata come soglia minima',
    rowHeightNote: 'Il 100% arriva fino al footer / ultima zona visibile, senza coprire intestazione, footer o la barra di navigazione <>.',
    addObjectToRowBtn: 'Aggiungi oggetto a questa riga',
    objectLabel: 'Oggetto', objectIdLabel: 'Object ID (Qlik)', widthInRowLabel: 'Larghezza nella riga',
    isMapExtToggle: "È una mappa o un'estensione (classic/chart)", borderToggle: 'Con bordo',
    borderColorLabel: 'Colore del bordo', bgColorObjLabel: "Colore di sfondo dell'oggetto",
    expandableToggle: 'Espandibile a schermo intero', minimizedToggle: 'Minimizzato per impostazione predefinita',
    minTitleLabel: 'Titolo (minimizzato)', minDescLabel: 'Descrizione (minimizzata)',
    addObjectsHint: 'Aggiungi oggetti dal panel destro', noObjectId: 'Nessun object-id', fullscreenLabel: '(schermo intero)',
    filtersTitle: 'Filtri', filterPanelHint: 'Pannello filtri (aggiungi un object-id opzionale)',
    selectionsPanelLabel: 'Pannello selezioni', noInfoYet: 'Nessuna descrizione ancora.',
    minimizedWidthNote: "Gli oggetti minimizzati occupano sempre il 100% della larghezza e si dispongono uno sotto l'altro.",
    minimizedBgNote: "Questo colore si applica solo al menu minimizzato; una volta espanso, l'oggetto usa il design definito in Qlik, senza colore di sfondo.",
    footerIconColorLabel: 'Colore delle icone di navigazione', filterButtonsLabel: 'Pulsanti del pannello filtri (opzionale, fino a 3, alti 50px)', filterButtonLabel: 'Pulsante',
    defaultObjectBgLabel: 'Colore di sfondo predefinito degli oggetti', filterPanelWidthLabel: 'Larghezza del pannello filtri', filterButtonsNote: 'I pulsanti appaiono nell\'intestazione, a sinistra dell\'icona filtri, in tutte le schede tranne Home.',
    minimizedTextColorLabel: 'Colore del testo (minimizzato)', generateOauthCallbackLabel: 'Genera oauth-callback.html', aboutAppTitle: 'Informazioni su questa app',
    headerTextColorLabel: "Colore del testo e delle icone della barra superiore", extraTextOverPhotoToggle: "Mostra il testo extra sopra la foto", extraTextColorLabel: 'Colore del testo extra',
    titleColorLabel: 'Colore del titolo e delle freccette di navigazione', rowGapLabel: 'Spaziatura tra le righe', topBarBgColorLabel: 'Colore di sfondo della barra superiore',
    welcomeFooterToggle: 'Includi un piè di pagina in questa scheda', welcomeFooterTextLabel: 'Testo del piè di pagina', hiddenMenuTitle: 'Menu', navHiddenTopStyleImproved: '',
    oauthZipNote: 'Verrà scaricato come mashup-export.zip (index.html + oauth-callback.html), poiché i browser bloccano un secondo download automatico.',
    homeTabDefaultName: 'Home', welcomeDefaultTitle: 'Benvenuto', welcomeDefaultSubtitle: 'Esplora i tuoi dati da mobile', newTabDefaultName: 'Nuova scheda', tabDefaultNamePrefix: 'Scheda',
    objectShadowToggle: 'Ombra leggera',
    activeIconColorLabel: "Colore dell'icona attiva", pageTitleLabel: 'Titolo della pagina (<title>)', faviconLabel: 'Favicon (URL)', importCssLabel: 'Importa CSS esterno (URL)',
    saveProjectLabel: 'Salva progetto (.json)', loadProjectLabel: 'Carica progetto (.json)', projectNamePlaceholder: 'nome-progetto',
    projectLoadedNote: 'Progetto caricato correttamente.', projectLoadErrorNote: 'Impossibile leggere il file: non è un progetto valido.',
    autosaveRestoredNote: 'Il tuo progetto salvato è stato ripristinato automaticamente.',
    rowAllMinimizedNote: "Questa riga contiene solo oggetti minimizzati: si adatta sempre al suo contenuto e non usa altezza % né altezza minima."
  },
  fr: {
    appAuth: 'App et Auth', headerBtn: 'En-tête', exportBtn: 'Exporter',
    authType: "Type d'authentification", anonymous: 'Anonyme', appIdDefault: "ID d'application (par défaut)",
    navGlobalLabel: 'Navigation (tous les onglets)', navFooter: 'Navigation en pied de page', navHiddenTop: 'Panneau supérieur masqué',
    fontGeneral: 'Police générale', minFontSize: 'Taille minimale du texte', logoPosition: 'Position du logo',
    left: 'Gauche', center: 'Centre', right: 'Droite', logoLabel: 'Logo',
    extraImageLabel: "Image supplémentaire dans l'en-tête", uploadBtn: 'Importer',
    textBefore: 'Texte avant le logo', textAfter: 'Texte après le logo',
    defaultPalette: 'Palette par défaut', paletteAppliesNote: "S'applique aussi à l'onglet actuellement affiché.",
    tabsLabel: 'Onglets', namePlaceholder: 'Nom...', addHome: 'Home', addAnalytics: 'Analytics',
    portrait: 'Portrait', landscape: 'Paysage',
    generalSectionTitle: 'Général (info et icône de pied de page)', infoIconToggle: "Icône d'information (i)",
    infoPopupText: "Texte de la fenêtre d'information", infoPopupPlaceholder: "Explication sur l'application que l'utilisateur verra...",
    footerIconLabel: 'Icône de cet onglet dans le pied de page / menu',
    paletteThisTab: 'Palette de cet onglet', referenceVisual: 'Référence visuelle',
    referenceImageLabel: "Image d'exemple (référence uniquement, non exportée)",
    headerMedia: "Média d'en-tête", mediaType: 'Type de média', image: 'Image', video: 'Vidéo',
    urlVideo: 'URL de la vidéo', urlPhoto: 'URL de la photo', blockHeight: 'Hauteur du bloc',
    videoNote: "La vidéo est centrée et recadrée (cover) dans cet espace, sans recouvrir l'en-tête.",
    titleSubtitle: 'Titre et sous-titre', titleLabel: 'Titre', subtitleLabel: 'Sous-titre',
    textPosition: 'Position du texte', topLeft: 'Haut gauche', topCenter: 'Haut centre',
    posCenter: 'Centre', bottomLeft: 'Bas gauche', bottomCenter: 'Bas centre',
    extraTextLabel: 'Texte supplémentaire (facultatif)', navExtrasTitle: 'Extras de navigation sur cet onglet',
    shortcutCardsToggle: "Cartes numérotées d'accès aux onglets", nextIconToggle: "Icône pour aller à l'onglet suivant",
    commentsTitle: 'Commentaires / modifications imprévues', commentsPlaceholder: 'Décrivez tout ajustement supplémentaire pour cet onglet...',
    commentsNote: 'Sera inclus comme commentaire HTML à côté de cet onglet dans le index.html exporté.',
    dataSourceTitle: 'Source de données', useOwnAppId: "Utiliser un ID d'application différent de celui global", ownAppIdLabel: "ID d'application de cet onglet",
    navTabTitle: "Navigation de l'onglet", filterIconToggle: "Icône du panneau de filtres (dans l'en-tête)",
    filterObjectIdLabel: "ID de l'objet de sélections (facultatif)", navPrevToggle: "Icône pour aller à l'onglet précédent", navNextToggle: "Icône pour aller à l'onglet suivant",
    rowsSectionTitle: 'Lignes et objets', addRowBtn: 'Ajouter une ligne',
    rowsHintNote: "Les objets d'une même ligne s'alignent automatiquement à la même hauteur ; s'ils ne rentrent pas dans la largeur disponible, ils s'empilent verticalement.",
    bgColorTab: "Couleur de fond de l'onglet",
    rowLabel: 'Ligne', useHeightPctToggle: "Occuper % de l'écran", rowHeightPctSuffix: "% de l'écran disponible",
    minHeightLabel: 'Hauteur minimale (px) — toujours respectée comme plancher',
    rowHeightNote: "100 % atteint le pied de page / dernière zone visible, sans recouvrir l'en-tête, le pied de page ni la barre de navigation <>.",
    addObjectToRowBtn: 'Ajouter un objet à cette ligne',
    objectLabel: 'Objet', objectIdLabel: 'Object ID (Qlik)', widthInRowLabel: 'Largeur dans la ligne',
    isMapExtToggle: "C'est une carte ou une extension (classic/chart)", borderToggle: 'Avec bordure',
    borderColorLabel: 'Couleur de la bordure', bgColorObjLabel: 'Couleur de fond de l\'objet',
    expandableToggle: 'Extensible en plein écran', minimizedToggle: 'Réduit par défaut',
    minTitleLabel: 'Titre (réduit)', minDescLabel: 'Description (réduit)',
    addObjectsHint: 'Ajoutez des objets depuis le panneau de droite', noObjectId: "Aucun object-id", fullscreenLabel: '(plein écran)',
    filtersTitle: 'Filtres', filterPanelHint: "Panneau de filtres (ajoutez un object-id facultatif)",
    selectionsPanelLabel: 'Panneau de sélections', noInfoYet: 'Pas encore de description.',
    minimizedWidthNote: "Les objets réduits occupent toujours 100 % de la largeur et s'empilent les uns sous les autres.",
    minimizedBgNote: "Cette couleur s'applique uniquement au menu réduit ; une fois développé, l'objet utilise le design défini dans Qlik, sans couleur de fond.",
    footerIconColorLabel: 'Couleur des icônes de navigation', filterButtonsLabel: "Boutons du panneau de filtres (facultatif, jusqu'à 3, 50px de hauteur)", filterButtonLabel: 'Bouton',
    defaultObjectBgLabel: 'Couleur de fond par défaut des objets', filterPanelWidthLabel: 'Largeur du panneau de filtres', filterButtonsNote: "Les boutons apparaissent dans l'en-tête, à gauche de l'icône de filtres, sur tous les onglets sauf Home.",
    minimizedTextColorLabel: 'Couleur de la police (réduit)', generateOauthCallbackLabel: 'Générer oauth-callback.html', aboutAppTitle: 'À propos de cette application',
    headerTextColorLabel: "Couleur du texte et des icônes de la barre supérieure", extraTextOverPhotoToggle: "Afficher le texte supplémentaire sur la photo", extraTextColorLabel: 'Couleur du texte supplémentaire',
    titleColorLabel: 'Couleur du titre et des flèches de navigation', rowGapLabel: 'Espacement entre les lignes', topBarBgColorLabel: "Couleur de fond de la barre supérieure",
    welcomeFooterToggle: 'Inclure un pied de page sur cet onglet', welcomeFooterTextLabel: 'Texte du pied de page', hiddenMenuTitle: 'Menu', navHiddenTopStyleImproved: '',
    oauthZipNote: "Le fichier sera téléchargé sous forme de mashup-export.zip (index.html + oauth-callback.html), car les navigateurs bloquent un second téléchargement automatique.",
    homeTabDefaultName: 'Accueil', welcomeDefaultTitle: 'Bienvenue', welcomeDefaultSubtitle: 'Explorez vos données depuis votre mobile', newTabDefaultName: 'Nouvel onglet', tabDefaultNamePrefix: 'Onglet',
    objectShadowToggle: 'Ombre douce',
    activeIconColorLabel: "Couleur de l'icône active", pageTitleLabel: 'Titre de la page (<title>)', faviconLabel: 'Favicon (URL)', importCssLabel: 'Importer un CSS externe (URL)',
    saveProjectLabel: 'Enregistrer le projet (.json)', loadProjectLabel: 'Charger le projet (.json)', projectNamePlaceholder: 'nom-du-projet',
    projectLoadedNote: 'Projet chargé avec succès.', projectLoadErrorNote: "Impossible de lire le fichier : ce n'est pas un projet valide.",
    autosaveRestoredNote: 'Votre projet enregistré a été restauré automatiquement.',
    rowAllMinimizedNote: "Cette ligne ne contient que des objets réduits : elle s'ajuste toujours à son contenu et n'utilise ni hauteur en % ni hauteur minimale."
  },
  pt: {
    appAuth: 'App e Auth', headerBtn: 'Cabeçalho', exportBtn: 'Exportar',
    authType: 'Tipo de autenticação', anonymous: 'Anónima', appIdDefault: 'App ID (predefinido)',
    navGlobalLabel: 'Navegação (todas as abas)', navFooter: 'Navegação no pé de página', navHiddenTop: 'Painel superior oculto',
    fontGeneral: 'Fonte geral', minFontSize: 'Tamanho mínimo do texto', logoPosition: 'Posição do logótipo',
    left: 'Esquerda', center: 'Centro', right: 'Direita', logoLabel: 'Logótipo',
    extraImageLabel: 'Imagem adicional no cabeçalho', uploadBtn: 'Carregar',
    textBefore: 'Texto antes do logótipo', textAfter: 'Texto depois do logótipo',
    defaultPalette: 'Paleta padrão', paletteAppliesNote: 'Também se aplica à aba que estás a ver agora.',
    tabsLabel: 'Abas', namePlaceholder: 'Nome...', addHome: 'Home', addAnalytics: 'Analytics',
    portrait: 'Retrato', landscape: 'Paisagem',
    generalSectionTitle: 'Geral (info e ícone do pé de página)', infoIconToggle: 'Ícone de informação (i)',
    infoPopupText: 'Texto do popup de informação', infoPopupPlaceholder: 'Explicação sobre a app que o utilizador verá...',
    footerIconLabel: 'Ícone desta aba no pé de página / menu',
    paletteThisTab: 'Paleta desta aba', referenceVisual: 'Referência visual',
    referenceImageLabel: 'Imagem de exemplo (apenas referência, não é exportada)',
    headerMedia: 'Media do cabeçalho', mediaType: 'Tipo de media', image: 'Imagem', video: 'Vídeo',
    urlVideo: 'URL do vídeo', urlPhoto: 'URL da foto', blockHeight: 'Altura do bloco',
    videoNote: 'O vídeo é centrado e recortado (cover) dentro deste espaço, sem invadir o cabeçalho.',
    titleSubtitle: 'Título e subtítulo', titleLabel: 'Título', subtitleLabel: 'Subtítulo',
    textPosition: 'Posição do texto', topLeft: 'Topo esquerda', topCenter: 'Topo centro',
    posCenter: 'Centro', bottomLeft: 'Baixo esquerda', bottomCenter: 'Baixo centro',
    extraTextLabel: 'Texto extra (opcional)', navExtrasTitle: 'Extras de navegação nesta aba',
    shortcutCardsToggle: 'Cartões numerados de acesso às abas', nextIconToggle: 'Ícone para ir para a próxima aba',
    commentsTitle: 'Comentários / alterações não previstas', commentsPlaceholder: 'Descreve qualquer ajuste adicional para esta aba...',
    commentsNote: 'Será incluído como comentário HTML junto a esta aba no index.html exportado.',
    dataSourceTitle: 'Origem dos dados', useOwnAppId: 'Usar um App ID diferente do global', ownAppIdLabel: 'App ID desta aba',
    navTabTitle: 'Navegação da aba', filterIconToggle: 'Ícone do painel de filtros (no cabeçalho)',
    filterObjectIdLabel: 'ID do objeto de seleções (opcional)', navPrevToggle: 'Ícone para ir para a aba anterior', navNextToggle: 'Ícone para ir para a próxima aba',
    rowsSectionTitle: 'Linhas e objetos', addRowBtn: 'Adicionar linha',
    rowsHintNote: 'Os objetos da mesma linha alinham-se automaticamente à mesma altura; se não couberem na largura disponível, ficam um debaixo do outro.',
    bgColorTab: 'Cor de fundo da aba',
    rowLabel: 'Linha', useHeightPctToggle: 'Ocupar % do ecrã', rowHeightPctSuffix: '% do ecrã disponível',
    minHeightLabel: 'Altura mínima (px) — sempre respeitada como limite mínimo',
    rowHeightNote: 'Os 100% chegam até ao pé de página / última zona visível, sem cobrir o cabeçalho, o pé de página ou a barra de navegação <>.',
    addObjectToRowBtn: 'Adicionar objeto a esta linha',
    objectLabel: 'Objeto', objectIdLabel: 'Object ID (Qlik)', widthInRowLabel: 'Largura na linha',
    isMapExtToggle: 'É um mapa ou extensão (classic/chart)', borderToggle: 'Com borda',
    borderColorLabel: 'Cor da borda', bgColorObjLabel: 'Cor de fundo do objeto',
    expandableToggle: 'Expansível a ecrã inteiro', minimizedToggle: 'Minimizado por padrão',
    minTitleLabel: 'Título (minimizado)', minDescLabel: 'Descrição (minimizado)',
    addObjectsHint: 'Adiciona objetos a partir do painel direito', noObjectId: 'Sem object-id', fullscreenLabel: '(ecrã inteiro)',
    filtersTitle: 'Filtros', filterPanelHint: 'Painel de filtros (adiciona um object-id opcional)',
    selectionsPanelLabel: 'Painel de seleções', noInfoYet: 'Ainda sem descrição.',
    minimizedWidthNote: 'Os objetos minimizados ocupam sempre 100% da largura e ficam um debaixo do outro.',
    minimizedBgNote: 'Esta cor aplica-se apenas ao menu minimizado; depois de expandido, o objeto usa o design definido no Qlik, sem cor de fundo.',
    footerIconColorLabel: 'Cor dos ícones de navegação', filterButtonsLabel: 'Botões do painel de filtros (opcional, até 3, 50px de altura)', filterButtonLabel: 'Botão',
    defaultObjectBgLabel: 'Cor de fundo padrão dos objetos', filterPanelWidthLabel: 'Largura do painel de filtros', filterButtonsNote: 'Os botões aparecem no cabeçalho, à esquerda do ícone de filtros, em todas as abas exceto Home.',
    minimizedTextColorLabel: 'Cor da fonte (minimizado)', generateOauthCallbackLabel: 'Gerar oauth-callback.html', aboutAppTitle: 'Sobre esta app',
    headerTextColorLabel: 'Cor do texto e dos ícones da barra superior', extraTextOverPhotoToggle: 'Mostrar o texto extra sobre a foto', extraTextColorLabel: 'Cor do texto extra',
    titleColorLabel: 'Cor do título e das flechas de navegação', rowGapLabel: 'Espaçamento entre linhas', topBarBgColorLabel: 'Cor de fundo da barra superior',
    welcomeFooterToggle: 'Incluir pé de página nesta aba', welcomeFooterTextLabel: 'Texto do pé de página', hiddenMenuTitle: 'Menu', navHiddenTopStyleImproved: '',
    oauthZipNote: 'Será descarregado como mashup-export.zip (index.html + oauth-callback.html), já que os navegadores bloqueiam uma segunda descarga automática.',
    homeTabDefaultName: 'Início', welcomeDefaultTitle: 'Bem-vindo', welcomeDefaultSubtitle: 'Explora os teus dados a partir do telemóvel', newTabDefaultName: 'Nova aba', tabDefaultNamePrefix: 'Aba',
    objectShadowToggle: 'Sombra suave',
    activeIconColorLabel: 'Cor do ícone ativo', pageTitleLabel: 'Título da página (<title>)', faviconLabel: 'Favicon (URL)', importCssLabel: 'Importar CSS externo (URL)',
    saveProjectLabel: 'Guardar projeto (.json)', loadProjectLabel: 'Carregar projeto (.json)', projectNamePlaceholder: 'nome-do-projeto',
    projectLoadedNote: 'Projeto carregado com sucesso.', projectLoadErrorNote: 'Não foi possível ler o ficheiro: não é um projeto válido.',
    autosaveRestoredNote: 'O teu projeto guardado foi restaurado automaticamente.',
    rowAllMinimizedNote: 'Esta linha contém apenas objetos minimizados: ajusta-se sempre ao seu conteúdo e não usa altura em % nem altura mínima.'
  }
};
const LangContext = createContext((k) => k);
function useT() { return useContext(LangContext); }

// ---------------------------------------------------------------------------
// PRESETS
// ---------------------------------------------------------------------------
const PRESETS = {
  qlik: { key: 'qlik', name: 'Qlik Clásico', bg: '#FFFFFF', overlay: 'rgba(0,0,0,0.45)', text: '#1E1E1E', textSecondary: '#5F6368', accent: '#009845', card: '#F7F8FA', cardBorder: '#E0E0E0' },
  editorial: { key: 'editorial', name: 'Editorial Oscuro', bg: '#0F0F10', overlay: 'rgba(0,0,0,0.55)', text: '#FFFFFF', textSecondary: '#B3B3B3', accent: '#E63946', card: '#1A1A1C', cardBorder: '#2A2A2C' },
  neon: { key: 'neon', name: 'Tech Neón', bg: '#000000', overlay: 'rgba(0,0,0,0.60)', text: '#FFFFFF', textSecondary: '#8C8C8C', accent: '#39FF88', card: '#111513', cardBorder: '#1E2620' },
  warm: { key: 'warm', name: 'Cálido Editorial', bg: '#F5EFE0', overlay: 'rgba(20,18,12,0.35)', text: '#1B2A3A', textSecondary: '#6B6B6B', accent: '#D98E31', card: '#16232E', cardBorder: '#D98E31' },
  light: { key: 'light', name: 'Claro Minimal', bg: '#F7F7F5', overlay: 'rgba(0,0,0,0.45)', text: '#111111', textSecondary: '#6B7280', accent: '#111111', card: '#FFFFFF', cardBorder: '#E4E4E1' },
  amber: { key: 'amber', name: 'Oscuro Ámbar', bg: '#0B0B0C', overlay: 'rgba(0,0,0,0.55)', text: '#FFFFFF', textSecondary: '#A3A3A3', accent: '#FFC107', card: '#171717', cardBorder: '#2A2A2A' },
  metal: { key: 'metal', name: 'Azul Metálico', bg: '#0F1B2D', overlay: 'rgba(6,14,26,0.55)', text: '#F1F5F9', textSecondary: '#93A9C2', accent: '#CBD5E1', card: '#16273D', cardBorder: '#28425E' }
};

const FONTS = [
  { key: 'inter', label: 'Inter', css: "'Inter', system-ui, sans-serif", link: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap' },
  { key: 'system', label: 'System', css: '-apple-system, system-ui, sans-serif', link: null },
  { key: 'georgia', label: 'Georgia', css: "Georgia, 'Times New Roman', serif", link: null },
  { key: 'mono', label: 'Mono', css: "'Courier New', monospace", link: null },
  { key: 'poppins', label: 'Poppins', css: "'Poppins', sans-serif", link: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap' },
  { key: 'playfair', label: 'Playfair Display', css: "'Playfair Display', serif", link: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;800&display=swap' }
];
const DEVICES = [
  { key: 'se', label: 'iPhone SE', w: 375, h: 667 }, { key: 'xr', label: 'iPhone XR', w: 414, h: 896 },
  { key: '1213', label: 'iPhone 12/13', w: 390, h: 844 },
  { key: '14pm', label: 'iPhone 14 PM', w: 430, h: 932 }, { key: 's21', label: 'Galaxy S21', w: 360, h: 800 },
  { key: 'pixel7', label: 'Pixel 7', w: 412, h: 915 },
  { key: 'ipad', label: 'iPad', w: 810, h: 1080 }, { key: 'ipadpro11', label: 'iPad Pro 11"', w: 834, h: 1194 },
  { key: 'ipadpro129', label: 'iPad Pro 12.9"', w: 1024, h: 1366 },
  { key: 'monitorhd', label: 'Monitor HD', w: 1280, h: 800 }, { key: 'monitorfhd', label: 'Monitor FHD', w: 1920, h: 1080 }
];

const FOOTER_ICONS = {
  home: { label: 'Inicio', path: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>' },
  chart: { label: 'Gráfico', path: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>' },
  pie: { label: 'Circular', path: '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>' },
  star: { label: 'Destacado', path: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>' },
  users: { label: 'Clientes', path: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
  cart: { label: 'Compras', path: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>' },
  trending: { label: 'Tendencia', path: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>' },
  layers: { label: 'Capas', path: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>' },
  map: { label: 'Regiones', path: '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>' },
  globe: { label: 'Geografía', path: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>' },
  reports: { label: 'Informes', path: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>' },
  kpi: { label: 'KPIs', path: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>' },
  product: { label: 'Productos', path: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>' },
  alert: { label: 'Alertas', path: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>' },
  revenue: { label: 'Ingresos', path: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' }
};

const EXPAND_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>';
const REDUCE_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M9 3v4a2 2 0 0 1-2 2H3M21 9h-4a2 2 0 0 1-2-2V3M3 15h4a2 2 0 0 1 2 2v4M15 21v-4a2 2 0 0 1 2-2h4"/></svg>';
const NEXT_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';
const MENU_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
const INFO_SVG = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
const FILTER_SVG = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>';
const PREV_SVG = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 18l-6-6 6-6"/></svg>';
const NEXT_SVG_DARK = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 18l6-6-6-6"/></svg>';

const uid = () => Math.random().toString(36).slice(2, 9);
function iconSvg(key, size = 16) {
  const ic = FOOTER_ICONS[key] || FOOTER_ICONS.home;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ic.path}</svg>`;
}

// ---------------------------------------------------------------------------
// DEFAULT DATA
// ---------------------------------------------------------------------------
function defaultHeaderCfg() { return { navStyle: 'footer', logoUrl: '', logoPosition: 'left', extraImageUrl: '', textBefore: '', textAfter: '', bgColor: '#FFFFFF', textColor: '#1E1E1E', activeIconBgColor: '#FFFFFF', fontKey: 'inter', minFontSize: 15, defaultObjectBgColor: '#F7F8FA', footerIconColor: '#009845', filterEnabled: false, filterObjectId: '', filterButtons: ['', '', ''], filterPanelWidth: 290, pageTitle: '', faviconUrl: '', importCssUrl: '' }; }
function defaultInfo() { return { enabled: false, text: '' }; }
function defaultWelcome(t, preset) {
  const title = t ? t('welcomeDefaultTitle') : 'Bienvenido';
  const subtitle = t ? t('welcomeDefaultSubtitle') : 'Explora tus datos desde el móvil';
  return { mediaType: 'image', mediaUrl: '', mediaHeightPct: 55, title, subtitle, titlePosition: 'bottom-left', showShortcutCards: true, extraText: '', extraTextOverPhoto: false, extraTextColor: preset ? preset.text : '#1E1E1E', nextIcon: true, comments: '', bgColor: preset ? preset.bg : '#FFFFFF', showFooter: false, footerText: '' };
}
function defaultObject(preset, bgOverride) {
  return { id: uid(), objectId: '', border: true, borderColor: preset.accent, bgColor: bgOverride || preset.card, shadow: false, expandable: true, minimizedByDefault: false, minimizedTitle: '', minimizedDesc: '', minimizedTextColor: preset.text, isMapOrExt: false };
}
function defaultRow(preset, bgOverride) { return { id: uid(), useHeightPct: false, heightPct: 40, minHeight: 300, objects: [defaultObject(preset, bgOverride)] }; }
function defaultAnalytics(preset, bgOverride) { return { useOwnAppId: false, appIdOverride: '', bgColor: preset.bg, titleColor: preset.text, subtitle: '', navPrev: true, navNext: true, rowGap: 15, rows: [defaultRow(preset, bgOverride)], comments: '' }; }
function makeTab(type, name, presetKey, bgOverride, t) {
  const preset = PRESETS[presetKey];
  return { id: uid(), name, type, presetKey, footerIcon: type === 'welcome' ? 'home' : 'chart', info: defaultInfo(), welcome: defaultWelcome(t, preset), analytics: defaultAnalytics(preset, bgOverride) };
}
function esc(s = '') { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function formatInfoTextHtml(text, accentColor) {
  const escaped = esc(text || '');
  const paragraphs = escaped.split(/\n+/).filter(p => p.trim() !== '');
  const linkStyle = `color:${accentColor};text-decoration:underline;word-break:break-all;`;
  const emailStyle = `color:#3B82F6;text-decoration:underline;word-break:break-all;`;
  return paragraphs.map(p => {
    let html = p.replace(/((https?:\/\/|www\.)[^\s<]+)/g, (m) => {
      const href = m.startsWith('http') ? m : 'https://' + m;
      return `<a href="${href}" target="_blank" rel="noopener" style="${linkStyle}">${m}</a>`;
    });
    html = html.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, (m) => `<a href="mailto:${m}" style="${emailStyle}">${m}</a>`);
    return `<p style="margin:0 0 10px;">${html}</p>`;
  }).join('');
}

// ---------------------------------------------------------------------------
// SMALL UI HELPERS (light / Qlik-like theme)
// ---------------------------------------------------------------------------
function Ico({ name, size = 16, color = 'currentColor' }) {
  const ic = FOOTER_ICONS[name] || FOOTER_ICONS.home;
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: ic.path }} />;
}
function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-200">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-3 py-2 text-left">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-3 pb-3 space-y-3">{children}</div>}
    </div>
  );
}
function Field({ label, children }) { return <label className="block"><span className="block text-xs text-gray-500 mb-1">{label}</span>{children}</label>; }
function TextInput(props) { return <input {...props} className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500" />; }
function TextArea(props) { return <textarea {...props} className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500" />; }
function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-1">
      <span className="text-sm text-gray-800">{label}</span>
      <button type="button" onClick={() => onChange(!checked)} className="relative w-9 h-5 rounded-full transition-colors" style={{ backgroundColor: checked ? '#009845' : '#D1D5DB' }}>
        <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }} />
      </button>
    </label>
  );
}
function ColorField({ label, value, onChange, swatches = [] }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-8 h-8 rounded border border-gray-300 bg-white cursor-pointer" />
        <input type="text" value={value} onChange={e => onChange(e.target.value)} className="flex-1 bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 min-w-0" />
        <div className="flex gap-1">{swatches.map(s => <button key={s} onClick={() => onChange(s)} title={s} className="w-5 h-5 rounded-full border border-gray-300" style={{ backgroundColor: s }} />)}</div>
      </div>
    </Field>
  );
}
function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500">
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
function IconPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {Object.entries(FOOTER_ICONS).map(([key, ic]) => (
        <button key={key} onClick={() => onChange(key)} title={ic.label} className={`h-8 rounded flex items-center justify-center border ${value === key ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-300 bg-white text-gray-600'}`}>
          <Ico name={key} size={15} />
        </button>
      ))}
    </div>
  );
}
function UploadLabel() { const t = useT(); return <>{t('uploadBtn')}</>; }
function ImageUrlField({ label, value, onChange }) {
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <input value={value} onChange={e => onChange(e.target.value)} placeholder="https://..." className="flex-1 bg-white border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 placeholder-gray-400 min-w-0" />
        <label className="text-xs px-2 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer whitespace-nowrap shrink-0">
          <UploadLabel />
          <input type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => onChange(reader.result); reader.readAsDataURL(file); }} />
        </label>
      </div>
    </Field>
  );
}
function PaletteGrid({ activeKey, onPick }) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {Object.values(PRESETS).map(p => (
        <button key={p.key} onClick={() => onPick(p.key)} title={p.name} className="h-9 rounded border-2 flex items-center justify-center" style={{ backgroundColor: p.bg, borderColor: activeKey === p.key ? '#009845' : '#E5E7EB' }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.accent }} />
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
export default function MashupBuilder() {
  const [autosave] = useState(loadAutosave);
  const [restoredBanner, setRestoredBanner] = useState(!!autosave);
  const [lang, setLang] = useState(autosave?.lang || 'es');
  const t = (key) => (I18N[lang] && I18N[lang][key]) || I18N.es[key] || key;

  const [global, setGlobal] = useState(autosave?.global || { appId: '', authType: 'anonymous', host: '', clientId: '', accessCode: '', redirectUri: '', generateOauthCallback: true });
  const [header, setHeader] = useState(autosave?.header || defaultHeaderCfg());
  const [defaultPresetKey, setDefaultPresetKey] = useState(autosave?.defaultPresetKey || 'qlik');
  const [initTab] = useState(() => makeTab('welcome', t('homeTabDefaultName'), 'qlik', header.defaultObjectBgColor, t));
  const [tabs, setTabs] = useState(() => (autosave?.tabs && autosave.tabs.length) ? autosave.tabs : [initTab]);
  const [selectedId, setSelectedId] = useState(() => {
    const savedTabs = autosave?.tabs;
    if (savedTabs && savedTabs.some(tb => tb.id === autosave.selectedId)) return autosave.selectedId;
    return savedTabs && savedTabs[0] ? savedTabs[0].id : initTab.id;
  });
  const [frame, setFrame] = useState(autosave?.frame || { w: 375, h: 812 });
  const [landscape, setLandscape] = useState(autosave?.landscape || false);
  const [globalOpen, setGlobalOpen] = useState(false);
  const [headerOpen, setHeaderOpen] = useState(true);
  const [newTabName, setNewTabName] = useState('');
  const [projectFileName, setProjectFileName] = useState('mi-mashup');
  const [projectMessage, setProjectMessage] = useState('');
  const fileInputRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const data = { lang, defaultPresetKey, frame, landscape, global, header, tabs, selectedId };
    const json = serializeProject(data);
    const timer = setTimeout(() => {
      try { localStorage.setItem(AUTOSAVE_KEY, json); } catch (e) { /* storage full or unavailable: ignore */ }
    }, 500);
    return () => clearTimeout(timer);
  }, [lang, defaultPresetKey, frame, landscape, global, header, tabs, selectedId]);

  useEffect(() => {
    if (!restoredBanner) return;
    const timer = setTimeout(() => setRestoredBanner(false), 6000);
    return () => clearTimeout(timer);
  }, [restoredBanner]);

  function handleSaveProject() {
    const data = { lang, defaultPresetKey, frame, landscape, global, header, tabs, selectedId };
    const json = serializeProject(data);
    downloadBlob(`${sanitizeFileName(projectFileName)}.json`, new Blob([json], { type: 'application/json' }));
  }
  function handleLoadProjectFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = parseProjectFile(String(reader.result));
        setLang(data.lang || 'es');
        setGlobal(data.global || { appId: '', authType: 'anonymous', host: '', clientId: '', accessCode: '', redirectUri: '', generateOauthCallback: true });
        setHeader(data.header || defaultHeaderCfg());
        setDefaultPresetKey(data.defaultPresetKey || 'qlik');
        setTabs(data.tabs);
        setSelectedId(data.tabs.some(tb => tb.id === data.selectedId) ? data.selectedId : data.tabs[0].id);
        setFrame(data.frame || { w: 375, h: 812 });
        setLandscape(!!data.landscape);
        setProjectMessage(t('projectLoadedNote'));
      } catch (e) {
        setProjectMessage(t('projectLoadErrorNote'));
      }
      setTimeout(() => setProjectMessage(''), 5000);
    };
    reader.readAsText(file);
  }

  const selectedTab = tabs.find(t2 => t2.id === selectedId) || tabs[0];

  function updateTab(id, patch) { setTabs(prev => prev.map(tb => tb.id === id ? { ...tb, ...patch } : tb)); }
  function updateWelcome(id, patch) { setTabs(prev => prev.map(tb => tb.id === id ? { ...tb, welcome: { ...tb.welcome, ...patch } } : tb)); }
  function updateAnalytics(id, patch) { setTabs(prev => prev.map(tb => tb.id === id ? { ...tb, analytics: { ...tb.analytics, ...patch } } : tb)); }
  function updateInfo(id, patch) { setTabs(prev => prev.map(tb => tb.id === id ? { ...tb, info: { ...tb.info, ...patch } } : tb)); }
  function updateFooterIcon(id, key) { updateTab(id, { footerIcon: key }); }
  function addTab(type) {
    const name = newTabName.trim() || (type === 'welcome' ? t('newTabDefaultName') : `${t('tabDefaultNamePrefix')} ${tabs.length + 1}`);
    const tb = makeTab(type, name, defaultPresetKey, header.defaultObjectBgColor, t);
    setTabs(prev => [...prev, tb]); setSelectedId(tb.id); setNewTabName('');
  }
  function removeTab(id) { setTabs(prev => { const next = prev.filter(tb => tb.id !== id); if (selectedId === id && next.length) setSelectedId(next[0].id); return next; }); }
  function renameTab(id, name) { updateTab(id, { name }); }
  function applyPresetToTab(id, presetKey) {
    const preset = PRESETS[presetKey];
    setTabs(prev => prev.map(tb => {
      if (tb.id !== id) return tb;
      if (tb.type === 'welcome') return { ...tb, presetKey, welcome: { ...tb.welcome, bgColor: preset.bg, extraTextColor: preset.text } };
      return { ...tb, presetKey, analytics: { ...tb.analytics, bgColor: preset.bg, titleColor: preset.text, rows: tb.analytics.rows.map(r => ({ ...r, objects: r.objects.map(o => ({ ...o, borderColor: preset.accent, bgColor: preset.card })) })) } };
    }));
  }
  function pickDefaultPreset(key) { setDefaultPresetKey(key); if (selectedTab) applyPresetToTab(selectedTab.id, key); }

  function addRow(tabId) { setTabs(prev => prev.map(tb => { if (tb.id !== tabId) return tb; const preset = PRESETS[tb.presetKey]; return { ...tb, analytics: { ...tb.analytics, rows: [...tb.analytics.rows, defaultRow(preset, header.defaultObjectBgColor)] } }; })); }
  function removeRow(tabId, rowId) { setTabs(prev => prev.map(tb => { if (tb.id !== tabId) return tb; let rows = tb.analytics.rows.filter(r => r.id !== rowId); if (rows.length === 0) rows = [defaultRow(PRESETS[tb.presetKey])]; return { ...tb, analytics: { ...tb.analytics, rows } }; })); }
  function moveRow(tabId, rowId, dir) {
    setTabs(prev => prev.map(tb => {
      if (tb.id !== tabId) return tb;
      const arr = [...tb.analytics.rows]; const idx = arr.findIndex(r => r.id === rowId); const swap = idx + dir;
      if (swap < 0 || swap >= arr.length) return tb;
      [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
      return { ...tb, analytics: { ...tb.analytics, rows: arr } };
    }));
  }
  function updateRow(tabId, rowId, patch) { setTabs(prev => prev.map(tb => tb.id === tabId ? { ...tb, analytics: { ...tb.analytics, rows: tb.analytics.rows.map(r => r.id === rowId ? { ...r, ...patch } : r) } } : tb)); }
  function addObjectToRow(tabId, rowId) { setTabs(prev => prev.map(tb => { if (tb.id !== tabId) return tb; const preset = PRESETS[tb.presetKey]; return { ...tb, analytics: { ...tb.analytics, rows: tb.analytics.rows.map(r => r.id === rowId ? { ...r, objects: [...r.objects, defaultObject(preset, header.defaultObjectBgColor)] } : r) } }; })); }
  function updateObjectInRow(tabId, rowId, objId, patch) { setTabs(prev => prev.map(tb => tb.id === tabId ? { ...tb, analytics: { ...tb.analytics, rows: tb.analytics.rows.map(r => r.id === rowId ? { ...r, objects: r.objects.map(o => o.id === objId ? { ...o, ...patch } : o) } : r) } } : tb)); }
  function removeObjectFromRow(tabId, rowId, objId) {
    setTabs(prev => prev.map(tb => {
      if (tb.id !== tabId) return tb;
      let rows = tb.analytics.rows.map(r => r.id === rowId ? { ...r, objects: r.objects.filter(o => o.id !== objId) } : r);
      if (rows.length > 1) rows = rows.filter(r => r.objects.length > 0);
      if (rows.length === 0) rows = [defaultRow(PRESETS[tb.presetKey])];
      return { ...tb, analytics: { ...tb.analytics, rows } };
    }));
  }
  function moveObjectInRow(tabId, rowId, objId, dir) {
    setTabs(prev => prev.map(tb => {
      if (tb.id !== tabId) return tb;
      return { ...tb, analytics: { ...tb.analytics, rows: tb.analytics.rows.map(r => {
        if (r.id !== rowId) return r;
        const arr = [...r.objects]; const idx = arr.findIndex(o => o.id === objId); const swap = idx + dir;
        if (swap < 0 || swap >= arr.length) return r;
        [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
        return { ...r, objects: arr };
      }) } };
    }));
  }
  function goRelative(dir) { const idx = tabs.findIndex(tb => tb.id === selectedId); const target = tabs[idx + dir]; if (target) setSelectedId(target.id); }

  function startResize(e) {
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY, startW = frame.w, startH = frame.h;
    function onMove(ev) { const dw = ev.clientX - startX, dh = ev.clientY - startY; setFrame({ w: Math.max(280, Math.min(1920, startW + dw)), h: Math.max(480, Math.min(1400, startH + dh)) }); }
    function onUp() { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
  }

  const effW = landscape ? frame.h : frame.w;
  const effH = landscape ? frame.w : frame.h;

  return (
    <LangContext.Provider value={t}>
      <div className="w-full h-screen bg-white text-gray-900 flex flex-col overflow-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white shrink-0">
          <div className="flex items-center gap-2"><Layers size={18} className="text-emerald-600" /><span className="font-semibold text-sm text-gray-900">Qlik Mashup Builder</span></div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs px-2 py-1.5 rounded bg-white border border-gray-300">
              <Globe size={13} className="text-gray-500" />
              <select value={lang} onChange={e => setLang(e.target.value)} className="bg-transparent focus:outline-none text-gray-700">
                {LANGS.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
              </select>
            </div>
            <button onClick={() => setGlobalOpen(o => !o)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-white hover:bg-gray-50 border border-gray-300 text-gray-700"><Settings size={13} /> {t('appAuth')}</button>
            <button onClick={() => setHeaderOpen(o => !o)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-white hover:bg-gray-50 border border-gray-300 text-gray-700"><Layers size={13} /> {t('headerBtn')}</button>
            <div className="flex items-center gap-1 border border-gray-300 rounded overflow-hidden">
              <input type="text" value={projectFileName} onChange={e => setProjectFileName(e.target.value)} placeholder={t('projectNamePlaceholder')} className="w-24 text-xs px-2 py-1.5 bg-white text-gray-700 focus:outline-none" />
              <button onClick={handleSaveProject} title={t('saveProjectLabel')} className="px-2 py-1.5 bg-white hover:bg-gray-50 border-l border-gray-300 text-gray-700"><Save size={13} /></button>
              <button onClick={() => fileInputRef.current?.click()} title={t('loadProjectLabel')} className="px-2 py-1.5 bg-white hover:bg-gray-50 border-l border-gray-300 text-gray-700"><Upload size={13} /></button>
            </div>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleLoadProjectFile(f); e.target.value = ''; }} />
            <ExportButton global={global} header={header} tabs={tabs} label={t('exportBtn')} lang={lang} />
          </div>
        </div>

        {(restoredBanner || projectMessage) && (
          <div className="px-4 py-1.5 text-xs text-center border-b border-gray-200 bg-emerald-50 text-emerald-700 shrink-0 flex items-center justify-center gap-2">
            <RefreshCw size={12} />
            <span>{projectMessage || t('autosaveRestoredNote')}</span>
            <button onClick={() => { setRestoredBanner(false); setProjectMessage(''); }} className="text-emerald-500 hover:text-emerald-700 text-sm leading-none">×</button>
          </div>
        )}

        {globalOpen && <GlobalConfigBar global={global} setGlobal={setGlobal} />}
        {headerOpen && <HeaderConfigBar header={header} setHeader={setHeader} />}

        <div className="flex-1 flex overflow-hidden min-h-0">
          <div className="w-60 shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col overflow-y-auto min-h-0">
            <div className="p-3 border-b border-gray-200">
              <span className="text-xs font-semibold uppercase text-gray-500">{t('defaultPalette')}</span>
              <div className="mt-2"><PaletteGrid activeKey={defaultPresetKey} onPick={pickDefaultPreset} /></div>
              <p className="text-[10px] text-gray-400 mt-1.5">{t('paletteAppliesNote')}</p>
            </div>

            <div className="p-3 flex-1">
              <span className="text-xs font-semibold uppercase text-gray-500">{t('tabsLabel')} ({tabs.length})</span>
              <div className="mt-2 space-y-1.5">
                {tabs.map((tb, i) => (
                  <div key={tb.id} onClick={() => setSelectedId(tb.id)} className={`group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer border ${selectedId === tb.id ? 'bg-emerald-50 border-emerald-500' : 'border-transparent hover:bg-gray-100'}`}>
                    <span className="text-gray-500 shrink-0"><Ico name={tb.footerIcon} size={13} /></span>
                    <input value={tb.name} onChange={e => renameTab(tb.id, e.target.value)} onClick={e => e.stopPropagation()} className="flex-1 bg-transparent text-sm text-gray-900 focus:outline-none min-w-0" />
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 shrink-0">{tb.type === 'welcome' ? t('addHome') : t('addAnalytics')}</span>
                    {tabs.length > 1 && <button onClick={(e) => { e.stopPropagation(); removeTab(tb.id); }} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 shrink-0"><Trash2 size={13} /></button>}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-1.5">
                <input value={newTabName} onChange={e => setNewTabName(e.target.value)} placeholder={t('namePlaceholder')} className="flex-1 bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 placeholder-gray-400 min-w-0" />
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                <button onClick={() => addTab('welcome')} className="flex items-center justify-center gap-1 text-xs px-2 py-1.5 rounded bg-white hover:bg-gray-100 border border-gray-300 text-gray-700"><Plus size={12} /> {t('addHome')}</button>
                <button onClick={() => addTab('analytics')} className="flex items-center justify-center gap-1 text-xs px-2 py-1.5 rounded bg-white hover:bg-gray-100 border border-gray-300 text-gray-700"><Plus size={12} /> {t('addAnalytics')}</button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-gray-100 min-h-0">
            <div className="min-h-full flex flex-col items-center justify-center gap-3 p-6">
              <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap justify-center max-w-full">
                <Smartphone size={13} />
                <span>{Math.round(effW)} × {Math.round(effH)} px</span>
                <button onClick={() => setLandscape(l => !l)} className="flex items-center gap-1 px-2 py-1 rounded bg-white hover:bg-gray-50 border border-gray-300"><RotateCw size={12} /> {landscape ? t('portrait') : t('landscape')}</button>
                {DEVICES.map(d => <button key={d.key} onClick={() => setFrame({ w: d.w, h: d.h })} className="px-2 py-1 rounded bg-white hover:bg-gray-50 border border-gray-300">{d.label}</button>)}
              </div>

              <div ref={frameRef} className="relative bg-black rounded-[28px] shadow-2xl border-4 border-gray-800 shrink-0" style={{ width: effW, height: effH }}>
                <div className="absolute inset-0 rounded-[24px] overflow-hidden bg-white">
                  <PreviewFrame tab={selectedTab} tabs={tabs} header={header} onSelectTab={setSelectedId} onNext={() => goRelative(1)} onPrev={() => goRelative(-1)} />
                </div>
                <div onMouseDown={startResize} title="Resize" className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-600 rounded-full cursor-nwse-resize border-2 border-white" />
              </div>
            </div>
          </div>

          <div className="w-96 shrink-0 border-l border-gray-200 bg-white overflow-y-auto min-h-0">
            {selectedTab.type === 'welcome' ? (
              <WelcomePanel tab={selectedTab} update={(p) => updateWelcome(selectedTab.id, p)} updateInfo={(p) => updateInfo(selectedTab.id, p)} updateFooterIcon={(k) => updateFooterIcon(selectedTab.id, k)} applyPreset={(k) => applyPresetToTab(selectedTab.id, k)} />
            ) : (
              <AnalyticsPanel tab={selectedTab} global={global}
                update={(p) => updateAnalytics(selectedTab.id, p)}
                updateInfo={(p) => updateInfo(selectedTab.id, p)}
                updateFooterIcon={(k) => updateFooterIcon(selectedTab.id, k)}
                applyPreset={(k) => applyPresetToTab(selectedTab.id, k)}
                addRow={() => addRow(selectedTab.id)}
                removeRow={(rid) => removeRow(selectedTab.id, rid)}
                moveRow={(rid, dir) => moveRow(selectedTab.id, rid, dir)}
                updateRow={(rid, p) => updateRow(selectedTab.id, rid, p)}
                addObjectToRow={(rid) => addObjectToRow(selectedTab.id, rid)}
                updateObjectInRow={(rid, oid, p) => updateObjectInRow(selectedTab.id, rid, oid, p)}
                removeObjectFromRow={(rid, oid) => removeObjectFromRow(selectedTab.id, rid, oid)}
                moveObjectInRow={(rid, oid, dir) => moveObjectInRow(selectedTab.id, rid, oid, dir)} />
            )}
          </div>
        </div>
      </div>
    </LangContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// GLOBAL CONFIG BAR
// ---------------------------------------------------------------------------
function GlobalConfigBar({ global, setGlobal }) {
  const t = useT();
  const set = (patch) => setGlobal(g => ({ ...g, ...patch }));
  return (
    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0 max-h-[40vh] overflow-y-auto">
      <Field label={t('appIdDefault')}><TextInput value={global.appId} onChange={e => set({ appId: e.target.value })} placeholder="ej. 3c1f4b2a-..." /></Field>
      <Field label={t('authType')}><Select value={global.authType} onChange={v => set({ authType: v })} options={[{ value: 'anonymous', label: t('anonymous') }, { value: 'oauth2', label: 'OAuth2' }]} /></Field>
      <Field label="data-host"><TextInput value={global.host} onChange={e => set({ host: e.target.value })} placeholder="https://tenant.region.qlikcloud.com" /></Field>
      <Field label="data-client-id"><TextInput value={global.clientId} onChange={e => set({ clientId: e.target.value })} placeholder="client-id" /></Field>
      {global.authType === 'anonymous' ? (
        <Field label="data-access-code"><TextInput value={global.accessCode} onChange={e => set({ accessCode: e.target.value })} placeholder="access-code" /></Field>
      ) : (
        <>
          <Field label="data-redirect-uri"><TextInput value={global.redirectUri} onChange={e => set({ redirectUri: e.target.value })} placeholder="https://tu-dominio/oauth-callback.html" /></Field>
          <div className="flex flex-col justify-end">
            <Toggle checked={global.generateOauthCallback} onChange={v => set({ generateOauthCallback: v })} label={t('generateOauthCallbackLabel')} />
            {global.generateOauthCallback && <p className="text-[10px] text-gray-400 mt-1">{t('oauthZipNote')}</p>}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// HEADER CONFIG BAR
// ---------------------------------------------------------------------------
function HeaderConfigBar({ header, setHeader }) {
  const t = useT();
  const set = (patch) => setHeader(h => ({ ...h, ...patch }));
  const buttons = header.filterButtons || ['', '', ''];
  return (
    <div className="border-b border-gray-200 bg-gray-50 shrink-0 max-h-[40vh] overflow-y-auto">
      <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Field label={t('navGlobalLabel')}><Select value={header.navStyle} onChange={v => set({ navStyle: v })} options={[{ value: 'footer', label: t('navFooter') }, { value: 'hidden-top', label: t('navHiddenTop') }]} /></Field>
        <Field label={t('fontGeneral')}><Select value={header.fontKey} onChange={v => set({ fontKey: v })} options={FONTS.map(f => ({ value: f.key, label: f.label }))} /></Field>
        <Field label={`${t('minFontSize')}: ${header.minFontSize}px`}><input type="range" min="11" max="20" value={header.minFontSize} onChange={e => set({ minFontSize: Number(e.target.value) })} className="w-full" /></Field>
        <Field label={t('logoPosition')}><Select value={header.logoPosition} onChange={v => set({ logoPosition: v })} options={[{ value: 'left', label: t('left') }, { value: 'center', label: t('center') }, { value: 'right', label: t('right') }]} /></Field>
        <ImageUrlField label={t('logoLabel')} value={header.logoUrl} onChange={v => set({ logoUrl: v })} />
        <ImageUrlField label={t('extraImageLabel')} value={header.extraImageUrl} onChange={v => set({ extraImageUrl: v })} />
        <Field label={t('textBefore')}><TextInput value={header.textBefore} onChange={e => set({ textBefore: e.target.value })} /></Field>
        <Field label={t('textAfter')}><TextInput value={header.textAfter} onChange={e => set({ textAfter: e.target.value })} /></Field>
        <ColorField label={t('defaultObjectBgLabel')} value={header.defaultObjectBgColor} onChange={v => set({ defaultObjectBgColor: v })} />
        <ColorField label={t('footerIconColorLabel')} value={header.footerIconColor} onChange={v => set({ footerIconColor: v })} />
        <ColorField label={t('topBarBgColorLabel')} value={header.bgColor} onChange={v => set({ bgColor: v })} />
        <ColorField label={t('headerTextColorLabel')} value={header.textColor} onChange={v => set({ textColor: v })} />
        <ColorField label={t('activeIconColorLabel')} value={header.activeIconBgColor} onChange={v => set({ activeIconBgColor: v })} />
      </div>
      <div className="px-4 py-3 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Toggle checked={header.filterEnabled} onChange={v => set({ filterEnabled: v })} label={t('filterIconToggle')} />
        {header.filterEnabled && (
          <>
            <Field label={t('filterObjectIdLabel')}><TextInput value={header.filterObjectId} onChange={e => set({ filterObjectId: e.target.value })} placeholder="object-id" /></Field>
            <Field label={`${t('filterPanelWidthLabel')}: ${header.filterPanelWidth}px`}>
              <input type="range" min="200" max="500" step="10" value={header.filterPanelWidth} onChange={e => set({ filterPanelWidth: Number(e.target.value) })} className="w-full" />
            </Field>
            <div />
            {[0, 1, 2].map(i => (
              <Field key={i} label={`${t('filterButtonLabel')} ${i + 1}`}>
                <TextInput value={buttons[i] || ''} onChange={e => { const arr = [...buttons]; arr[i] = e.target.value; set({ filterButtons: arr }); }} placeholder="object-id" />
              </Field>
            ))}
            <p className="text-[11px] text-gray-400 col-span-2 md:col-span-4 -mt-1">{t('filterButtonsNote')}</p>
          </>
        )}
      </div>
      <div className="px-4 py-3 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Field label={t('pageTitleLabel')}><TextInput value={header.pageTitle} onChange={e => set({ pageTitle: e.target.value })} placeholder="Qlik Mashup" /></Field>
        <ImageUrlField label={t('faviconLabel')} value={header.faviconUrl} onChange={v => set({ faviconUrl: v })} />
        <Field label={t('importCssLabel')}><TextInput value={header.importCssUrl} onChange={e => set({ importCssUrl: e.target.value })} placeholder="https://.../styles.css" /></Field>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GENERAL SECTION
// ---------------------------------------------------------------------------
function GeneralSection({ tab, updateInfo, updateFooterIcon }) {
  const t = useT();
  return (
    <Section title={t('generalSectionTitle')}>
      <Toggle checked={tab.info.enabled} onChange={v => updateInfo({ enabled: v })} label={t('infoIconToggle')} />
      {tab.info.enabled && <Field label={t('infoPopupText')}><TextArea rows={3} value={tab.info.text} onChange={e => updateInfo({ text: e.target.value })} placeholder={t('infoPopupPlaceholder')} /></Field>}
      <Field label={t('footerIconLabel')}><IconPicker value={tab.footerIcon} onChange={updateFooterIcon} /></Field>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// WELCOME PANEL
// ---------------------------------------------------------------------------
function WelcomePanel({ tab, update, updateInfo, updateFooterIcon, applyPreset }) {
  const t = useT();
  const w = tab.welcome;
  const preset = PRESETS[tab.presetKey];
  return (
    <div>
      <GeneralSection tab={tab} updateInfo={updateInfo} updateFooterIcon={updateFooterIcon} />
      <Section title={t('paletteThisTab')}>
        <PaletteGrid activeKey={tab.presetKey} onPick={applyPreset} />
        <ColorField label={t('bgColorTab')} value={w.bgColor || preset.bg} onChange={v => update({ bgColor: v })} swatches={[preset.bg, preset.card]} />
      </Section>

      <Section title={t('headerMedia')}>
        <Field label={t('mediaType')}><Select value={w.mediaType} onChange={v => update({ mediaType: v })} options={[{ value: 'image', label: t('image') }, { value: 'video', label: t('video') }]} /></Field>
        <Field label={w.mediaType === 'video' ? t('urlVideo') : t('urlPhoto')}><TextInput value={w.mediaUrl} onChange={e => update({ mediaUrl: e.target.value })} placeholder="https://..." /></Field>
        <Field label={`${t('blockHeight')}: ${w.mediaHeightPct}%`}><input type="range" min="25" max="85" value={w.mediaHeightPct} onChange={e => update({ mediaHeightPct: Number(e.target.value) })} className="w-full" /></Field>
        <p className="text-[11px] text-gray-400">{t('videoNote')}</p>
      </Section>

      <Section title={t('titleSubtitle')}>
        <Field label={t('titleLabel')}><TextInput value={w.title} onChange={e => update({ title: e.target.value })} /></Field>
        <Field label={t('subtitleLabel')}><TextArea rows={2} value={w.subtitle} onChange={e => update({ subtitle: e.target.value })} /></Field>
        <Field label={t('textPosition')}>
          <Select value={w.titlePosition} onChange={v => update({ titlePosition: v })} options={[{ value: 'top-left', label: t('topLeft') }, { value: 'top-center', label: t('topCenter') }, { value: 'center', label: t('posCenter') }, { value: 'bottom-left', label: t('bottomLeft') }, { value: 'bottom-center', label: t('bottomCenter') }]} />
        </Field>
        <Field label={t('extraTextLabel')}><TextArea rows={2} value={w.extraText} onChange={e => update({ extraText: e.target.value })} /></Field>
        <Toggle checked={w.extraTextOverPhoto} onChange={v => update({ extraTextOverPhoto: v })} label={t('extraTextOverPhotoToggle')} />
        <ColorField label={t('extraTextColorLabel')} value={w.extraTextColor || preset.text} onChange={v => update({ extraTextColor: v })} />
      </Section>

      <Section title={t('navExtrasTitle')}>
        <Toggle checked={w.showShortcutCards} onChange={v => update({ showShortcutCards: v })} label={t('shortcutCardsToggle')} />
        <Toggle checked={w.nextIcon} onChange={v => update({ nextIcon: v })} label={t('nextIconToggle')} />
        <Toggle checked={w.showFooter} onChange={v => update({ showFooter: v })} label={t('welcomeFooterToggle')} />
        {w.showFooter && <Field label={t('welcomeFooterTextLabel')}><TextInput value={w.footerText} onChange={e => update({ footerText: e.target.value })} /></Field>}
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ANALYTICS PANEL
// ---------------------------------------------------------------------------
function AnalyticsPanel({ tab, global, update, updateInfo, updateFooterIcon, applyPreset, addRow, removeRow, moveRow, updateRow, addObjectToRow, updateObjectInRow, removeObjectFromRow, moveObjectInRow }) {
  const t = useT();
  const a = tab.analytics;
  const preset = PRESETS[tab.presetKey];
  return (
    <div>
      <GeneralSection tab={tab} updateInfo={updateInfo} updateFooterIcon={updateFooterIcon} />

      <Section title={t('paletteThisTab')}>
        <PaletteGrid activeKey={tab.presetKey} onPick={applyPreset} />
        <ColorField label={t('bgColorTab')} value={a.bgColor} onChange={v => update({ bgColor: v })} swatches={[preset.bg, preset.card]} />
      </Section>

      <Section title={t('titleSubtitle')}>
        <Field label={t('subtitleLabel')}><TextInput value={a.subtitle} onChange={e => update({ subtitle: e.target.value })} placeholder="" /></Field>
      </Section>

      <Section title={t('dataSourceTitle')}>
        <Toggle checked={a.useOwnAppId} onChange={v => update({ useOwnAppId: v })} label={t('useOwnAppId')} />
        {a.useOwnAppId && <Field label={t('ownAppIdLabel')}><TextInput value={a.appIdOverride} onChange={e => update({ appIdOverride: e.target.value })} placeholder={global.appId || 'app-id'} /></Field>}
      </Section>

      <Section title={t('navTabTitle')}>
        <Toggle checked={a.navPrev} onChange={v => update({ navPrev: v })} label={t('navPrevToggle')} />
        <Toggle checked={a.navNext} onChange={v => update({ navNext: v })} label={t('navNextToggle')} />
        <ColorField label={t('titleColorLabel')} value={a.titleColor || preset.text} onChange={v => update({ titleColor: v })} />
        <Field label={`${t('rowGapLabel')}: ${a.rowGap ?? 15}px`}><input type="range" min="5" max="30" step="1" value={a.rowGap ?? 15} onChange={e => update({ rowGap: Number(e.target.value) })} className="w-full" /></Field>
      </Section>

      <Section title={`${t('rowsSectionTitle')} (${a.rows.length})`}>
        {a.rows.map((r, ri) => (
          <RowEditor key={r.id} row={r} index={ri} total={a.rows.length}
            onUpdate={p => updateRow(r.id, p)} onRemove={() => removeRow(r.id)} onMove={dir => moveRow(r.id, dir)}
            onAddObject={() => addObjectToRow(r.id)}
            onUpdateObject={(oid, p) => updateObjectInRow(r.id, oid, p)}
            onRemoveObject={(oid) => removeObjectFromRow(r.id, oid)}
            onMoveObjectInRow={(oid, dir) => moveObjectInRow(r.id, oid, dir)} />
        ))}
        <button onClick={addRow} className="mt-1 w-full flex items-center justify-center gap-1.5 text-xs px-2 py-2 rounded bg-white hover:bg-gray-50 border border-dashed border-gray-300 text-gray-600"><Plus size={13} /> {t('addRowBtn')}</button>
        <p className="text-[11px] text-gray-400 mt-1">{t('rowsHintNote')}</p>
      </Section>
    </div>
  );
}

function RowEditor({ row, index, total, onUpdate, onRemove, onMove, onAddObject, onUpdateObject, onRemoveObject, onMoveObjectInRow }) {
  const t = useT();
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-200 rounded mb-2">
      <div className="flex items-center justify-between px-2 py-1.5 bg-gray-50">
        <button onClick={() => setOpen(o => !o)} className="text-xs text-gray-700 font-medium flex items-center gap-1">
          <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} /> {t('rowLabel')} {index + 1} ({row.objects.length})
        </button>
        <div className="flex items-center gap-1">
          <button disabled={index === 0} onClick={() => onMove(-1)} className="disabled:opacity-30 text-gray-500 hover:text-gray-800"><ArrowUp size={12} /></button>
          <button disabled={index === total - 1} onClick={() => onMove(1)} className="disabled:opacity-30 text-gray-500 hover:text-gray-800"><ArrowDown size={12} /></button>
          <button onClick={onRemove} className="text-gray-500 hover:text-red-500"><Trash2 size={12} /></button>
        </div>
      </div>
      {open && (
        <div className="p-2.5 space-y-2.5">
          {row.objects.length > 0 && row.objects.every(o => o.minimizedByDefault) ? (
            <p className="text-[11px] text-gray-400">{t('rowAllMinimizedNote')}</p>
          ) : (
            <>
              <Toggle checked={row.useHeightPct} onChange={v => onUpdate({ useHeightPct: v })} label={t('useHeightPctToggle')} />
              {row.useHeightPct && <Field label={`${row.heightPct}${t('rowHeightPctSuffix')}`}><input type="range" min="1" max="100" step="1" value={row.heightPct} onChange={e => onUpdate({ heightPct: Number(e.target.value) })} className="w-full" /></Field>}
              <Field label={t('minHeightLabel')}><TextInput type="number" value={row.minHeight} onChange={e => onUpdate({ minHeight: Number(e.target.value) })} /></Field>
              {row.useHeightPct && <p className="text-[11px] text-gray-400">{t('rowHeightNote')}</p>}
            </>
          )}

          <div className="space-y-2">
            {row.objects.map((o, oi) => (
              <ObjectEditor key={o.id} obj={o} index={oi} total={row.objects.length}
                onChange={p => onUpdateObject(o.id, p)} onRemove={() => onRemoveObject(o.id)} onMove={dir => onMoveObjectInRow(o.id, dir)} />
            ))}
          </div>
          <button onClick={onAddObject} className="w-full flex items-center justify-center gap-1.5 text-xs px-2 py-1.5 rounded bg-white hover:bg-gray-50 border border-dashed border-gray-300 text-gray-600"><Plus size={12} /> {t('addObjectToRowBtn')}</button>
        </div>
      )}
    </div>
  );
}

function ObjectEditor({ obj, index, total, onChange, onRemove, onMove }) {
  const t = useT();
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-200 rounded bg-white">
      <div className="flex items-center justify-between px-2 py-1.5 bg-gray-50">
        <button onClick={() => setOpen(o => !o)} className="text-xs text-gray-700 flex items-center gap-1 min-w-0">
          <ChevronDown size={12} className={`transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
          <span className="truncate">{t('objectLabel')} {index + 1}{obj.objectId ? ` — ${obj.objectId}` : ''}</span>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <button disabled={index === 0} onClick={() => onMove(-1)} className="disabled:opacity-30 text-gray-500 hover:text-gray-800"><ArrowUp size={12} /></button>
          <button disabled={index === total - 1} onClick={() => onMove(1)} className="disabled:opacity-30 text-gray-500 hover:text-gray-800"><ArrowDown size={12} /></button>
          <button onClick={onRemove} className="text-gray-500 hover:text-red-500"><Trash2 size={12} /></button>
        </div>
      </div>
      {open && (
        <div className="p-2.5 space-y-2.5">
          <Field label={t('objectIdLabel')}><TextInput value={obj.objectId} onChange={e => onChange({ objectId: e.target.value })} placeholder="object-id" /></Field>
          <Toggle checked={obj.isMapOrExt} onChange={v => onChange({ isMapOrExt: v })} label={t('isMapExtToggle')} />
          <Toggle checked={obj.border} onChange={v => onChange({ border: v })} label={t('borderToggle')} />
          {obj.border && <ColorField label={t('borderColorLabel')} value={obj.borderColor} onChange={v => onChange({ borderColor: v })} />}
          <Toggle checked={obj.shadow} onChange={v => onChange({ shadow: v })} label={t('objectShadowToggle')} />
          <ColorField label={t('bgColorObjLabel')} value={obj.bgColor} onChange={v => onChange({ bgColor: v })} />
          {obj.minimizedByDefault && <p className="text-[11px] text-gray-400">{t('minimizedBgNote')}</p>}
          {!obj.minimizedByDefault && <Toggle checked={obj.expandable} onChange={v => onChange({ expandable: v })} label={t('expandableToggle')} />}
          <Toggle checked={obj.minimizedByDefault} onChange={v => onChange({ minimizedByDefault: v })} label={t('minimizedToggle')} />
          {obj.minimizedByDefault && (
            <>
              <Field label={t('minTitleLabel')}><TextInput value={obj.minimizedTitle} onChange={e => onChange({ minimizedTitle: e.target.value })} /></Field>
              <Field label={t('minDescLabel')}><TextInput value={obj.minimizedDesc} onChange={e => onChange({ minimizedDesc: e.target.value })} /></Field>
              <ColorField label={t('minimizedTextColorLabel')} value={obj.minimizedTextColor || '#1E1E1E'} onChange={v => onChange({ minimizedTextColor: v })} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PREVIEW
// ---------------------------------------------------------------------------
const posClasses = {
  'top-left': 'items-start justify-start text-left', 'top-center': 'items-start justify-center text-center',
  'center': 'items-center justify-center text-center', 'bottom-left': 'items-end justify-start text-left',
  'bottom-center': 'items-end justify-center text-center'
};
function oppositeZone(pos) { return pos === 'left' ? 'right' : pos === 'right' ? 'left' : 'right'; }

function GlobalHeaderBarPreview({ header, preset, showMenu, onMenuClick, showFilter, filterButtons, onFilterClick, showInfo, onInfoClick }) {
  const hasLogoGroup = header.logoUrl || header.textBefore || header.textAfter;
  const txtStyle = { color: header.textColor || preset.text, fontSize: `max(${header.minFontSize}px, 12px)` };
  const logoGroup = hasLogoGroup ? (
    <div className="flex items-center gap-1.5 min-w-0">
      {header.textBefore && <span className="font-medium truncate" style={txtStyle}>{header.textBefore}</span>}
      {header.logoUrl && <img src={header.logoUrl} alt="logo" className="h-5 max-w-[70px] object-contain" />}
      {header.textAfter && <span className="font-medium truncate" style={txtStyle}>{header.textAfter}</span>}
    </div>
  ) : null;
  const zones = { left: null, center: null, right: null };
  if (logoGroup) zones[header.logoPosition] = logoGroup;
  if (header.extraImageUrl) { const z = oppositeZone(header.logoPosition); zones[z] = <>{zones[z]}<img src={header.extraImageUrl} className="h-5 w-5 object-cover rounded" /></>; }
  return (
    <div className="flex items-center justify-between px-2.5 shrink-0" style={{ minHeight: 40, backgroundColor: header.bgColor || preset.bg, borderBottom: `1px solid ${preset.cardBorder}`, color: header.textColor || preset.text }}>
      <div className="flex items-center gap-1.5 flex-1 justify-start min-w-0">
        {showMenu && <button onClick={onMenuClick} className="p-1 shrink-0"><Menu size={16} /></button>}
        {zones.left}
      </div>
      <div className="flex items-center gap-1.5 justify-center shrink-0">{zones.center}</div>
      <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
        {zones.right}
        {showFilter && filterButtons.filter(id => id && id.trim()).map((id, i) => (
          <div key={i} className="w-10 h-10 shrink-0 flex items-center justify-center text-[8px] opacity-40 overflow-hidden px-0.5 truncate">{id}</div>
        ))}
        {showFilter && <button onClick={onFilterClick} className="p-1.5 shrink-0"><Filter size={24} /></button>}
        {showInfo && <button onClick={onInfoClick} className="p-1.5 shrink-0"><Info size={24} /></button>}
      </div>
    </div>
  );
}

function AnalyticsTopRow({ tab, preset, onPrev, onNext, minFontSize }) {
  const a = tab.analytics;
  const titleColor = a.titleColor || preset.text;
  return (
    <div className="flex items-center justify-between px-2.5 py-2 shrink-0" style={{ backgroundColor: a.bgColor, borderBottom: `1px solid ${preset.cardBorder}`, color: titleColor }}>
      <div className="flex items-center gap-2 w-9 shrink-0">{a.navPrev && <button onClick={onPrev}><ChevronLeft size={28} strokeWidth={2.2} /></button>}</div>
      <div className="flex-1 min-w-0 flex flex-col items-center text-center">
        <span className="font-semibold truncate w-full" style={{ fontSize: `max(${minFontSize}px, 14px)` }}>{tab.name}</span>
        {a.subtitle && <span className="truncate w-full" style={{ fontSize: `max(${minFontSize}px, 11px)`, color: '#9CA3AF' }}>{a.subtitle}</span>}
      </div>
      <div className="flex items-center gap-2 w-9 justify-end shrink-0">{a.navNext && <button onClick={onNext}><ChevronRight size={28} strokeWidth={2.2} /></button>}</div>
    </div>
  );
}

function NavBar({ tab, tabs, onSelectTab, minFontSize, iconColor }) {
  return (
    <div className="flex border-t border-black/10 bg-white/95 backdrop-blur shrink-0">
      {tabs.map(tb => (
        <button key={tb.id} onClick={() => onSelectTab(tb.id)} className="flex-1 flex flex-col items-center py-1.5 gap-0.5">
          <Ico name={tb.footerIcon} size={15} color={tb.id === tab.id ? iconColor : '#94A3B8'} />
          <span className="truncate max-w-full px-0.5" style={{ color: tb.id === tab.id ? iconColor : '#94A3B8', fontWeight: tb.id === tab.id ? 700 : 400, fontSize: `max(${minFontSize}px, 9px)` }}>{tb.name}</span>
        </button>
      ))}
    </div>
  );
}

function WelcomeContent({ tab, preset, tabs, onSelectTab, onNext, minFontSize, header }) {
  const w = tab.welcome;
  const others = tabs.filter(tb => tb.id !== tab.id);
  const fs = (px) => ({ fontSize: `max(${minFontSize}px, ${px}px)` });
  const extraTextColor = w.extraTextColor || preset.text;
  return (
    <div className="w-full" style={{ flex: '1 0 auto', display: 'flex', flexDirection: 'column', color: preset.text, backgroundColor: w.bgColor || preset.bg }}>
      <div className="relative w-full overflow-hidden" style={{ flex: `0 0 ${w.mediaHeightPct}%`, minHeight: 140 }}>
        {w.mediaType === 'video' && w.mediaUrl ? (
          <video src={w.mediaUrl} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: 'center' }} />
        ) : (
          <div className="absolute inset-0" style={{ backgroundImage: w.mediaUrl ? `url(${w.mediaUrl})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', background: !w.mediaUrl ? `linear-gradient(135deg, ${preset.card}, ${preset.bg})` : undefined }} />
        )}
        <div className={`relative z-10 flex flex-col p-4 w-full h-full ${posClasses[w.titlePosition]}`}>
          <h1 className="font-extrabold leading-tight" style={fs(20)}>{w.title || 'Título'}</h1>
          {w.subtitle && <p className="mt-1 opacity-80 max-w-[85%]" style={fs(12)}>{w.subtitle}</p>}
          {w.extraText && w.extraTextOverPhoto && <p className="mt-2 max-w-[90%]" style={{ ...fs(12), color: extraTextColor }}>{w.extraText}</p>}
        </div>
        {w.nextIcon && <button onClick={onNext} className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center bg-black/30" style={{ zIndex: 20 }}><ChevronRight size={14} color="#fff" /></button>}
      </div>
      {w.extraText && !w.extraTextOverPhoto && <p className="px-4 py-2" style={{ ...fs(12), color: extraTextColor }}>{w.extraText}</p>}
      {w.showShortcutCards && others.length > 0 && (
        <div className="px-4 py-2 space-y-2">
          {others.map((tb, i) => (
            <button key={tb.id} onClick={() => onSelectTab(tb.id)} className="w-full flex items-center justify-between py-2 border-b text-left" style={{ borderColor: preset.cardBorder }}>
              <div><span className="font-bold" style={{ color: preset.accent, ...fs(10) }}>{String(i + 1).padStart(2, '0')}</span><div className="font-semibold" style={fs(14)}>{tb.name}</div></div>
              <ChevronRight size={14} style={{ color: preset.accent }} />
            </button>
          ))}
        </div>
      )}
      {w.showFooter && (
        <div className="px-4 py-2.5 text-center mt-auto" style={{ backgroundColor: header.bgColor || preset.bg, color: header.textColor || preset.text, fontSize: 13 }}>
          {w.footerText}
        </div>
      )}
    </div>
  );
}

function RowPreview({ row, preset, onExpand, minFontSize }) {
  const allMinimized = row.objects.length > 0 && row.objects.every(o => o.minimizedByDefault);
  const style = allMinimized
    ? { flex: '0 0 auto' }
    : (row.useHeightPct ? { flex: `0 0 ${row.heightPct}%`, minHeight: row.minHeight } : { flex: '0 0 auto', minHeight: row.minHeight });
  return (
    <div className="flex flex-wrap gap-2 items-stretch" style={style}>
      {row.objects.map(o => <ObjectPreview key={o.id} obj={o} preset={preset} onExpand={onExpand} minFontSize={minFontSize} />)}
    </div>
  );
}
function ObjectPreview({ obj, preset, onExpand, minFontSize }) {
  const t = useT();
  if (obj.minimizedByDefault) {
    const minStyle = { flex: '0 0 100%', maxWidth: '100%', width: '100%', backgroundColor: obj.bgColor, color: obj.minimizedTextColor || preset.text, alignSelf: 'flex-start', height: 'auto', minHeight: 56, border: 'none', borderLeft: obj.border ? `3px solid ${obj.borderColor}` : 'none', boxShadow: obj.shadow ? '0 4px 14px rgba(0,0,0,0.12)' : 'none' };
    return (
      <button onClick={() => onExpand(obj.id)} style={minStyle} className="rounded flex items-center justify-between px-3 py-2 text-left">
        <div className="min-w-0">
          <div className="font-semibold truncate" style={{ fontSize: `max(${minFontSize}px, 14px)` }}>{obj.minimizedTitle || t('objectLabel')}</div>
          <div className="opacity-70 truncate" style={{ fontSize: `min(max(${minFontSize}px, 10px), 14px)` }}>{obj.minimizedDesc || ''}</div>
        </div>
        <ChevronRight size={14} style={{ color: obj.borderColor, flexShrink: 0 }} />
      </button>
    );
  }
  const style = { flex: '1 1 0%', minWidth: 0, backgroundColor: obj.bgColor, border: obj.border ? `1px solid ${obj.borderColor}` : 'none', boxShadow: obj.shadow ? '0 4px 14px rgba(0,0,0,0.12)' : 'none' };
  return (
    <div style={style} className="rounded relative flex items-center justify-center">
      <span className="opacity-50 px-2 text-center" style={{ fontSize: `max(${minFontSize}px, 10px)` }}>{obj.objectId ? `Qlik: ${obj.objectId}` : t('noObjectId')}</span>
      {obj.expandable && <button onClick={() => onExpand(obj.id)} className="absolute top-1.5 right-1.5 w-6 h-6 rounded flex items-center justify-center bg-black/60"><Maximize2 size={13} color="#fff" /></button>}
    </div>
  );
}
function AnalyticsContent({ tab, preset, onExpand, minFontSize }) {
  const t = useT();
  const a = tab.analytics;
  const empty = a.rows.every(r => r.objects.length === 0);
  return (
    <div className="flex flex-col p-3" style={{ flex: '1 0 auto', display: 'flex', gap: a.rowGap ?? 15 }}>
      {a.rows.map(row => <RowPreview key={row.id} row={row} preset={preset} onExpand={onExpand} minFontSize={minFontSize} />)}
      {empty && <p className="opacity-50 w-full text-center py-8" style={{ fontSize: `max(${minFontSize}px, 12px)` }}>{t('addObjectsHint')}</p>}
    </div>
  );
}
function findObjectInTab(tab, id) {
  if (!id || tab.type !== 'analytics') return null;
  for (const r of tab.analytics.rows) { const o = r.objects.find(x => x.id === id); if (o) return o; }
  return null;
}

function PreviewFrame({ tab, tabs, header, onSelectTab, onNext, onPrev }) {
  const t = useT();
  const preset = PRESETS[tab.presetKey];
  const font = FONTS.find(f => f.key === header.fontKey) || FONTS[0];
  const [infoOpen, setInfoOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedObjId, setExpandedObjId] = useState(null);
  const expandedObj = findObjectInTab(tab, expandedObjId);

  return (
    <div key={tab.id} className="relative w-full h-full flex flex-col overflow-hidden" style={{ fontFamily: font.css, fontSize: header.minFontSize, backgroundColor: '#fff' }}>
      <GlobalHeaderBarPreview header={header} preset={preset}
        showMenu={header.navStyle === 'hidden-top'} onMenuClick={() => setMenuOpen(o => !o)}
        showFilter={tab.type !== 'welcome' && header.filterEnabled} filterButtons={header.filterButtons || ['', '', '']} onFilterClick={() => setFilterOpen(o => !o)}
        showInfo={tab.info.enabled} onInfoClick={() => setInfoOpen(o => !o)} />

      {expandedObj ? (
        <div className="flex-1 relative bg-white flex flex-col overflow-hidden">
          <div className="flex-1 flex items-center justify-center text-xs opacity-50 p-4 text-center">
            {expandedObj.objectId ? `Qlik: ${expandedObj.objectId} ${t('fullscreenLabel')}` : t('noObjectId')}
          </div>
          <button onClick={() => setExpandedObjId(null)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center text-lg z-40">×</button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden relative" style={{ backgroundColor: tab.type === 'welcome' ? (tab.welcome.bgColor || preset.bg) : tab.analytics.bgColor }}>
          {tab.type === 'analytics' && <AnalyticsTopRow tab={tab} preset={preset} onPrev={onPrev} onNext={onNext} minFontSize={header.minFontSize} />}
          <div className="flex-1 overflow-y-auto relative flex flex-col">
            {tab.type === 'welcome'
              ? <WelcomeContent tab={tab} preset={preset} tabs={tabs} onSelectTab={onSelectTab} onNext={onNext} minFontSize={header.minFontSize} header={header} />
              : <AnalyticsContent tab={tab} preset={preset} onExpand={setExpandedObjId} minFontSize={header.minFontSize} />}
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="absolute inset-0 z-30 flex" onClick={() => setMenuOpen(false)}>
          <div className="h-full flex flex-col overflow-hidden shrink-0" style={{ width: 'min(78%, 300px)', backgroundColor: '#161616' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
              <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: header.footerIconColor }}>{t('hiddenMenuTitle')}</span>
              <button onClick={() => setMenuOpen(false)} style={{ color: '#fff' }}><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {tabs.map(tb => {
                const active = tb.id === tab.id;
                return (
                  <button key={tb.id} onClick={() => { onSelectTab(tb.id); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                    <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: active ? (header.activeIconBgColor || '#FFFFFF') : header.footerIconColor }}>
                      <Ico name={tb.footerIcon} size={16} color="#1A1A1A" />
                    </span>
                    <span className="flex-1 text-left text-sm truncate" style={{ fontWeight: active ? 700 : 600, color: active ? header.footerIconColor : '#F5F5F5' }}>{tb.name}</span>
                    <ChevronRight size={16} style={{ color: header.footerIconColor, flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex-1" style={{ backgroundColor: 'rgba(0,0,0,.45)' }} />
        </div>
      )}

      {header.navStyle === 'footer' && !expandedObj && <NavBar tab={tab} tabs={tabs} onSelectTab={onSelectTab} minFontSize={header.minFontSize} iconColor={header.footerIconColor} />}

      {filterOpen && tab.type !== 'welcome' && (
        <div className="absolute inset-0 z-50 flex">
          <div className="flex-1" style={{ backgroundColor: 'rgba(0,0,0,.4)' }} onClick={() => setFilterOpen(false)} />
          <div className="h-full flex flex-col bg-white" style={{ width: header.filterPanelWidth }}>
            <div className="flex items-center justify-between px-3 py-2.5 border-b shrink-0">
              <span className="text-sm font-semibold text-gray-900">{t('filtersTitle')}</span>
              <button onClick={() => setFilterOpen(false)} className="text-gray-500 text-lg">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
              <div className="flex-1 flex items-center justify-center text-xs text-gray-500 text-center">
                {header.filterObjectId ? `${t('selectionsPanelLabel')}: ${header.filterObjectId}` : t('filterPanelHint')}
              </div>
            </div>
          </div>
        </div>
      )}

      {infoOpen && (
        <div className="absolute inset-0 bg-black/50 z-60 flex items-center justify-center p-6" onClick={() => setInfoOpen(false)}>
          <div className="rounded-2xl p-5 max-w-[86%] text-xs relative shadow-2xl" style={{ backgroundColor: preset.card, color: preset.text }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setInfoOpen(false)} className="absolute top-3 right-3 opacity-70 text-lg leading-none" style={{ color: preset.text }}>×</button>
            <div className="font-extrabold uppercase tracking-wide mb-2.5" style={{ color: preset.accent, fontSize: 11, letterSpacing: '.05em' }}>{t('aboutAppTitle')}</div>
            <div className="leading-relaxed" style={{ fontSize: 12.5 }} dangerouslySetInnerHTML={{ __html: formatInfoTextHtml(tab.info.text, preset.accent) || `<p style="margin:0;">${esc(t('noInfoYet'))}</p>` }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EXPORT
// ---------------------------------------------------------------------------
function download(filename, content) {
  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
// Minimal zero-dependency ZIP writer (STORE method, no compression) so that
// exporting index.html + oauth-callback.html together always yields ONE download
// (browsers silently block a second automatic file download after the first).
function crc32(bytes) {
  if (!crc32.table) {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c;
    }
    crc32.table = t;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) crc = crc32.table[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
function buildZip(files) {
  const encoder = new TextEncoder();
  const fileParts = [];
  const centralParts = [];
  let offset = 0;
  files.forEach(f => {
    const nameBytes = encoder.encode(f.name);
    const data = encoder.encode(f.content);
    const crc = crc32(data);
    const size = data.length;
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0, true);
    local.setUint16(8, 0, true);
    local.setUint16(10, 0, true);
    local.setUint16(12, 0, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, size, true);
    local.setUint32(22, size, true);
    local.setUint16(26, nameBytes.length, true);
    local.setUint16(28, 0, true);
    fileParts.push(new Uint8Array(local.buffer), nameBytes, data);

    const central = new DataView(new ArrayBuffer(46));
    central.setUint32(0, 0x02014b50, true);
    central.setUint16(4, 20, true);
    central.setUint16(6, 20, true);
    central.setUint16(8, 0, true);
    central.setUint16(10, 0, true);
    central.setUint16(12, 0, true);
    central.setUint16(14, 0, true);
    central.setUint32(16, crc, true);
    central.setUint32(20, size, true);
    central.setUint32(24, size, true);
    central.setUint16(28, nameBytes.length, true);
    central.setUint16(30, 0, true);
    central.setUint16(32, 0, true);
    central.setUint16(34, 0, true);
    central.setUint16(36, 0, true);
    central.setUint32(38, 0, true);
    central.setUint32(42, offset, true);
    centralParts.push(new Uint8Array(central.buffer), nameBytes);

    offset += 30 + nameBytes.length + size;
  });
  const centralStart = offset;
  let centralSize = 0;
  centralParts.forEach(p => centralSize += p.length);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(4, 0, true);
  end.setUint16(6, 0, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, centralStart, true);
  end.setUint16(20, 0, true);
  return new Blob([...fileParts, ...centralParts, new Uint8Array(end.buffer)], { type: 'application/zip' });
}
function buildAuthScript(global) {
  if (global.authType === 'anonymous') {
    return `<script
  crossorigin="anonymous"
  type="application/javascript"
  src="https://cdn.jsdelivr.net/npm/@qlik/embed-web-components@1/dist/index.min.js"
  data-host="${esc(global.host)}"
  data-client-id="${esc(global.clientId)}"
  data-access-code="${esc(global.accessCode)}"
  data-auth-type="anonymous"
></script>`;
  }
  return `<script
  crossorigin="anonymous"
  type="application/javascript"
  src="https://cdn.jsdelivr.net/npm/@qlik/embed-web-components"
  data-host="${esc(global.host)}"
  data-client-id="${esc(global.clientId)}"
  data-redirect-uri="${esc(global.redirectUri)}"
  data-access-token-storage="session"
  data-auth-type="Oauth2"
  data-auto-redirect="true"
></script>`;
}
function buildOauthCallback(global) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<script
  crossorigin="anonymous"
  type="application/javascript"
  data-host="${esc(global.host)}"
  src="https://cdn.jsdelivr.net/npm/@qlik/api@2/oauth-callback.iife.js"
></script>
</head>
</html>`;
}

function objectHtml(o, appId) {
  const ui = o.isMapOrExt ? 'classic/chart' : 'analytics/chart';
  const inner = `<qlik-embed ui="${ui}" app-id="${esc(appId)}" object-id="${esc(o.objectId)}"></qlik-embed>`;
  const borderCss = o.border ? `border:1px solid ${o.borderColor};` : 'border:none;';
  const shadowCss = o.shadow ? `box-shadow:0 4px 14px rgba(0,0,0,0.12);` : '';
  const expandBtn = o.expandable ? `<button class="obj-expand-btn" onclick="toggleExpand('${o.id}')" aria-label="Ampliar">${EXPAND_SVG}</button>` : '';
  if (o.minimizedByDefault) {
    const minBorder = o.border ? `border-left:3px solid ${o.borderColor};` : '';
    return `<div class="obj-minimized" id="obj-${o.id}" style="flex:0 0 100%;max-width:100%;width:100%;align-self:flex-start;background:${o.bgColor};color:${o.minimizedTextColor || '#1E1E1E'};${minBorder}${shadowCss}">
  <button class="obj-minimized-toggle" onclick="toggleExpand('${o.id}')">
    <span class="obj-min-text"><span class="obj-min-title">${esc(o.minimizedTitle || 'Objeto')}</span><span class="obj-min-desc">${esc(o.minimizedDesc || '')}</span></span>
    <svg class="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
  </button>
  <div class="obj-min-body">
    <div class="obj-embed-wrap" style="width:100%;height:100%;position:relative;">${inner}</div>
  </div>
  <button class="obj-close-btn" onclick="toggleExpand('${o.id}')" aria-label="Cerrar">&times;</button>
</div>`;
  }
  return `<div class="obj-embed-wrap" id="obj-${o.id}" style="flex:1 1 0%;min-width:0;background:${o.bgColor};${borderCss}${shadowCss}position:relative;border-radius:6px;overflow:hidden;">${expandBtn}${inner}</div>`;
}
function rowHtml(row, appId) {
  const allMinimized = row.objects.length > 0 && row.objects.every(o => o.minimizedByDefault);
  const heightCss = allMinimized ? 'flex:0 0 auto;' : (row.useHeightPct ? `flex:0 0 ${row.heightPct}%;` : `flex:0 0 auto;`);
  const minHeightCss = allMinimized ? '' : `min-height:${row.minHeight}px;`;
  const objectsHtml = row.objects.map(o => objectHtml(o, appId)).join('\n');
  return `<div class="objects-row" style="${heightCss}${minHeightCss}">${objectsHtml}</div>`;
}

function buildGlobalFilterPanelHtml(header, global, tt) {
  const appId = global.appId;
  const mainHtml = header.filterObjectId
    ? `<div class="filter-main-embed" data-lazy-embed data-ui="analytics/chart" data-object-id="${esc(header.filterObjectId)}" data-app-id="${esc(appId)}"></div>`
    : '<!-- Añade el object-id del panel de selecciones en la configuración -->';
  return `<div class="filter-panel" id="global-filter-panel" style="width:${header.filterPanelWidth}px;"><div class="filter-header"><span>${esc(tt('filtersTitle'))}</span><button class="filter-close" onclick="toggleFilterPanel()">&times;</button></div><div class="filter-body"><div class="filter-main-object">${mainHtml}</div></div></div>`;
}
function tabSectionHtml(tab, allTabs, global, header, index) {
  const preset = PRESETS[tab.presetKey];
  const appId = tab.type === 'analytics' && tab.analytics.useOwnAppId ? tab.analytics.appIdOverride : global.appId;
  const fs = (px) => `font-size:max(${header.minFontSize}px, ${px}px);`;

  if (tab.type === 'welcome') {
    const w = tab.welcome;
    const others = allTabs.filter(t => t.id !== tab.id);
    const commentHtml = w.comments ? `\n  <!-- Comentarios pestaña "${esc(tab.name)}": ${esc(w.comments).replace(/--/g, '—')} -->` : '';
    const posMap = {
      'top-left': 'justify-content:flex-start;align-items:flex-start;text-align:left;', 'top-center': 'justify-content:flex-start;align-items:center;text-align:center;',
      'center': 'justify-content:center;align-items:center;text-align:center;', 'bottom-left': 'justify-content:flex-end;align-items:flex-start;text-align:left;',
      'bottom-center': 'justify-content:flex-end;align-items:center;text-align:center;'
    };
    return `<section class="tab-section" id="tab-${index}" style="background:${w.bgColor || preset.bg};color:${preset.text};display:${index === 0 ? 'flex' : 'none'};">${commentHtml}
  <div class="tab-content">
    <div class="hero" style="flex:0 0 ${w.mediaHeightPct}%;">
      ${w.mediaType === 'video' && w.mediaUrl
        ? `<video src="${esc(w.mediaUrl)}" autoplay muted loop playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;"></video>`
        : `<div style="position:absolute;inset:0;${w.mediaUrl ? `background-image:url('${esc(w.mediaUrl)}');background-size:cover;background-position:center;` : `background:linear-gradient(135deg, ${preset.card}, ${preset.bg});`}"></div>`}
      <div class="hero-text" style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:20px;${posMap[w.titlePosition]}">
        <h1 style="font-size:26px;font-weight:800;margin:0;">${esc(w.title)}</h1>
        ${w.subtitle ? `<p style="${fs(13)}opacity:.85;margin-top:6px;max-width:85%;">${esc(w.subtitle)}</p>` : ''}
        ${w.extraText && w.extraTextOverPhoto ? `<p style="${fs(13)}margin-top:8px;max-width:90%;color:${w.extraTextColor || preset.text};">${esc(w.extraText)}</p>` : ''}
      </div>
      ${w.nextIcon ? `<button class="overlay-btn next-btn" onclick="nextTab(${index})" aria-label="Siguiente">${NEXT_SVG}</button>` : ''}
    </div>
    ${w.extraText && !w.extraTextOverPhoto ? `<p style="padding:12px 16px;${fs(13)}color:${w.extraTextColor || preset.text};">${esc(w.extraText)}</p>` : ''}
    ${w.showShortcutCards ? `<div class="shortcut-cards">${others.map((t, oi) => `<div class="shortcut-card" style="border-color:${preset.cardBorder}" onclick="showTab(${allTabs.findIndex(x => x.id === t.id)})"><div><span class="num" style="color:${preset.accent}">${String(oi + 1).padStart(2, '0')}</span><div class="name" style="${fs(15)}">${esc(t.name)}</div></div><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${preset.accent}" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></div>`).join('')}</div>` : ''}
    ${w.showFooter ? `<div style="margin-top:auto;padding:10px 16px;text-align:center;font-size:13px;background:${header.bgColor || preset.bg};color:${header.textColor || preset.text};">${esc(w.footerText)}</div>` : ''}
  </div>
</section>`;
  }

  const a = tab.analytics;
  const commentHtml = a.comments ? `\n  <!-- Comentarios pestaña "${esc(tab.name)}": ${esc(a.comments).replace(/--/g, '—')} -->` : '';
  const rowsHtml = a.rows.map(r => rowHtml(r, appId)).join('\n');
  const titleColor = a.titleColor || preset.text;
  return `<section class="tab-section" id="tab-${index}" style="background:${a.bgColor};color:${preset.text};display:${index === 0 ? 'flex' : 'none'};">${commentHtml}
  <div class="analytics-header" style="background:${a.bgColor};color:${titleColor};border-bottom:1px solid ${preset.cardBorder};">
    <div class="header-left">${a.navPrev ? `<button class="icon-btn" onclick="prevTab(${index})" aria-label="Anterior">${PREV_SVG}</button>` : ''}</div>
    <div class="header-title-wrap">
      <span class="header-title" style="${fs(14)}">${esc(tab.name)}</span>
      ${a.subtitle ? `<span class="header-subtitle" style="${fs(11)}">${esc(a.subtitle)}</span>` : ''}
    </div>
    <div class="header-right">${a.navNext ? `<button class="icon-btn" onclick="nextTab(${index})" aria-label="Siguiente">${NEXT_SVG_DARK}</button>` : ''}</div>
  </div>
  <div class="tab-content">
    <div class="objects-grid" style="gap:${a.rowGap ?? 15}px;">${rowsHtml}</div>
  </div>
</section>`;
}

function generateIndexHtml(global, header, tabs, lang) {
  const tt = (k) => (I18N[lang] && I18N[lang][k]) || I18N.es[k] || k;
  const authScript = buildAuthScript(global);
  const font = FONTS.find(f => f.key === header.fontKey) || FONTS[0];
  const fontLink = font.link ? `<link rel="stylesheet" href="${font.link}">` : '';
  const sections = tabs.map((t, i) => tabSectionHtml(t, tabs, global, header, i)).join('\n');

  const hasLogoGroup = header.logoUrl || header.textBefore || header.textAfter;
  const logoGroupHtml = hasLogoGroup ? `<span class="gh-group">${header.textBefore ? `<span class="gh-text">${esc(header.textBefore)}</span>` : ''}${header.logoUrl ? `<img class="logo-img" src="${esc(header.logoUrl)}" alt="logo">` : ''}${header.textAfter ? `<span class="gh-text">${esc(header.textAfter)}</span>` : ''}</span>` : '';
  const extraZone = header.logoPosition === 'left' ? 'right' : header.logoPosition === 'right' ? 'left' : 'right';
  const zoneContent = { left: '', center: '', right: '' };
  zoneContent[header.logoPosition] += logoGroupHtml;
  if (header.extraImageUrl) zoneContent[extraZone] += `<img class="extra-img" src="${esc(header.extraImageUrl)}" alt="">`;

  const footerNavHtml = header.navStyle === 'footer'
    ? `<nav class="app-footer" id="app-footer" style="--icon-color:${esc(header.footerIconColor || '#009845')};">
  ${tabs.map((t, i) => `<button class="footer-item" data-idx="${i}" onclick="showTab(${i})"><span class="ficon">${iconSvg(t.footerIcon, 15)}</span><span>${esc(t.name)}</span></button>`).join('\n  ')}
</nav>`
    : '';
  const hiddenMenuHtml = header.navStyle === 'hidden-top'
    ? `<div class="menu-backdrop" id="menu-backdrop" onclick="toggleHiddenMenu()"></div>
<aside class="hidden-menu-panel" id="hidden-menu-panel" style="--icon-color:${esc(header.footerIconColor || '#009845')};--active-icon-bg:${esc(header.activeIconBgColor || '#FFFFFF')};">
  <div class="hidden-menu-head">
    <span class="hidden-menu-title">${esc(tt('hiddenMenuTitle'))}</span>
    <button class="hidden-menu-close" onclick="toggleHiddenMenu()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg></button>
  </div>
  <div class="hidden-menu-list">
    ${tabs.map((t, i) => `<div class="hidden-menu-item" data-idx="${i}" onclick="showTab(${i});toggleHiddenMenu();"><span class="micon">${iconSvg(t.footerIcon, 16)}</span><span class="mlabel">${esc(t.name)}</span><svg class="mchev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></div>`).join('\n    ')}
  </div>
</aside>`
    : '';
  const infoPopupsHtml = tabs.filter(t => t.info.enabled).map(t => {
    const preset = PRESETS[t.presetKey];
    return `<div class="info-popup" id="info-popup-${t.id}" style="display:none;"><div class="info-popup-inner" style="background:${preset.card};color:${preset.text};"><button class="popup-close" onclick="toggleInfoPopup('${t.id}')">&times;</button><div class="info-popup-title" style="color:${preset.accent};">${esc(tt('aboutAppTitle'))}</div>${formatInfoTextHtml(t.info.text, preset.accent)}</div></div>`;
  }).join('\n');
  const filterPanelHtml = header.filterEnabled ? buildGlobalFilterPanelHtml(header, global, tt) : '';
  const filterBackdrop = header.filterEnabled ? `<div class="filter-backdrop" id="filter-backdrop"></div>` : '';
  const filterButtonsIds = (header.filterButtons || []).filter(id => id && id.trim());
  const filterButtonsHtml = header.filterEnabled && filterButtonsIds.length
    ? `<span id="global-filter-buttons" style="display:none;">${filterButtonsIds.map(id => `<div class="header-filter-btn-slot" data-lazy-embed data-ui="analytics/chart" data-object-id="${esc(id)}" data-app-id="${esc(global.appId)}"></div>`).join('')}</span>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
${header.faviconUrl ? `<link rel="shortcut icon" type="image/x-icon" href="${esc(header.faviconUrl)}">` : ''}
<title>${esc(header.pageTitle && header.pageTitle.trim() ? header.pageTitle : 'Qlik Mashup')}</title>
${fontLink}
${header.importCssUrl ? `<link rel="stylesheet" href="${esc(header.importCssUrl)}">` : ''}
${authScript}
<style>
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body { margin:0; padding:0; height:100%; font-family: ${font.css}; font-size:${header.minFontSize}px; }
  qlik-embed { font-size: initial !important; }
  #app-shell { display:flex; flex-direction:column; width:100%; height:100vh; height:100dvh; overflow:hidden; }
  #global-header { display:flex; align-items:center; justify-content:space-between; padding:8px 12px; flex-shrink:0; min-height:40px; border-bottom:1px solid rgba(0,0,0,.08); position:relative; z-index:20; }
  #global-header .gh-zone { display:flex; align-items:center; gap:8px; min-width:0; }
  #global-header .gh-zone.left { flex:1; justify-content:flex-start; }
  #global-header .gh-zone.right { flex:1; justify-content:flex-end; }
  #global-header .gh-zone.center { flex-shrink:0; }
  #global-header .gh-group { display:flex; align-items:center; gap:6px; min-width:0; }
  #global-header .gh-text { font-size:max(${header.minFontSize}px,12px); font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:${header.textColor || '#1E1E1E'}; }
  #global-header .logo-img { height:20px; max-width:80px; object-fit:contain; }
  #global-header .extra-img { height:20px; width:20px; object-fit:cover; border-radius:4px; }
  #global-header .icon-btn { background:transparent; }
  #tabs-viewport { position:relative; flex:1; overflow:hidden; }
  .tab-section { position:absolute; inset:0; display:flex; flex-direction:column; overflow:hidden; }
  .tab-content { flex:1; overflow-y:auto; position:relative; display:flex; flex-direction:column; }
  .hero { position:relative; overflow:hidden; }
  .icon-btn { width:40px; height:40px; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; background:transparent; color:inherit; }
  .overlay-btn { position:absolute; z-index:5; width:32px; height:32px; border-radius:50%; background:rgba(0,0,0,.35); color:#fff; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; }
  .next-btn { top:12px; right:12px; }
  .shortcut-cards { padding: 4px 16px 16px; }
  .shortcut-card { display:flex; align-items:center; justify-content:space-between; padding:14px 0; border-bottom:1px solid; cursor:pointer; }
  .shortcut-card .num { font-size:max(${header.minFontSize}px,11px); font-weight:800; display:block; }
  .shortcut-card .name { font-weight:700; }
  .info-popup { position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:70; display:flex; align-items:center; justify-content:center; padding:24px; }
  .info-popup-inner { border-radius:16px; padding:20px; max-width:320px; position:relative; font-size:max(${header.minFontSize}px,13px); line-height:1.6; box-shadow:0 20px 40px rgba(0,0,0,.35); }
  .info-popup-title { font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.05em; margin-bottom:10px; }
  .popup-close { position:absolute; top:10px; right:12px; border:none; background:none; font-size:20px; line-height:1; opacity:.7; cursor:pointer; color:inherit; }
  .analytics-header { flex-shrink:0; position:relative; z-index:10; display:flex; align-items:center; justify-content:space-between; padding:10px 12px; }
  .analytics-header .header-left, .analytics-header .header-right { display:flex; gap:6px; align-items:center; color:inherit; }
  .header-title-wrap { flex:1; min-width:0; display:flex; flex-direction:column; align-items:center; text-align:center; }
  .header-title { font-weight:700; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .header-subtitle { color:#9CA3AF; margin-top:1px; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .objects-grid { display:flex; flex-direction:column; gap:15px; padding:10px; flex:1 0 auto; }
  .objects-row { display:flex; flex-wrap:wrap; align-items:stretch; gap:8px; }
  .obj-embed-wrap { display:block; }
  .obj-embed-wrap qlik-embed { width:100%; height:100%; display:block; }
  .obj-expand-btn { position:absolute; top:6px; right:6px; z-index:5; width:26px; height:26px; border-radius:6px; border:none; background:rgba(0,0,0,.6); display:flex; align-items:center; justify-content:center; cursor:pointer; color:#fff; }
  .obj-embed-wrap.obj-expanded { position:fixed !important; margin:0 !important; left:0; right:0; top:var(--global-header-h, 48px); bottom:0; width:100% !important; height:auto !important; flex:none !important; z-index:40; border-radius:0 !important; border:none !important; }
  .obj-minimized { border-radius:8px; overflow:hidden; position:relative; }
  .obj-minimized-toggle { width:100%; min-height:56px; display:flex; align-items:center; justify-content:space-between; gap:8px; padding:10px 14px; background:none; border:none; cursor:pointer; text-align:left; color:inherit; }
  .obj-min-text { display:flex; flex-direction:column; min-width:0; flex:1; overflow:hidden; }
  .obj-min-title, .obj-min-desc { display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .obj-min-title { font-size:max(${header.minFontSize}px,14px); font-weight:700; }
  .obj-min-desc { font-size:min(max(${header.minFontSize}px,11px),14px); opacity:.7; }
  .obj-min-body { display:none; padding:0 10px 10px; }
  .obj-close-btn { display:none; position:absolute; top:8px; right:8px; width:32px; height:32px; border-radius:50%; background:rgba(0,0,0,.5); color:#fff; border:none; font-size:22px; line-height:1; cursor:pointer; z-index:45; align-items:center; justify-content:center; }
  .obj-minimized.obj-expanded { position:fixed !important; left:0; right:0; top:var(--global-header-h,48px); bottom:0; z-index:41; background:#fff !important; border-radius:0 !important; border-left:none !important; display:flex; flex-direction:column; flex:none !important; max-width:none !important; align-self:auto !important; }
  .obj-minimized.obj-expanded .obj-minimized-toggle { display:none; }
  .obj-minimized.obj-expanded .obj-min-body { display:block !important; flex:1; padding:0; }
  .obj-minimized.obj-expanded .obj-embed-wrap { width:100% !important; height:100% !important; min-height:0 !important; border:none !important; border-radius:0 !important; background:transparent !important; }
  .obj-minimized.obj-expanded .obj-close-btn { display:flex; }
  .filter-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.4); z-index:64; display:none; }
  .filter-backdrop.open { display:block; }
  .filter-panel { position:fixed; top:0; bottom:0; right:0; max-width:92vw; height:100%; background:#fff; z-index:65; display:none; flex-direction:column; box-shadow:-4px 0 16px rgba(0,0,0,.25); }
  .filter-panel.open { display:flex; }
  .filter-header { flex-shrink:0; display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border-bottom:1px solid #eee; font-weight:700; }
  .filter-close { border:none; background:none; font-size:20px; cursor:pointer; }
  .filter-body { flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:10px; }
  .filter-body qlik-embed { width:100%; height:100%; display:block; }
  .filter-main-object { flex:1; min-height:0; position:relative; }
  .filter-main-embed { width:100%; height:100%; }
  .header-filter-btn-slot { width:40px; height:40px; flex-shrink:0; overflow:hidden; background:transparent; display:flex; align-items:center; justify-content:center; }
  .header-filter-btn-slot qlik-embed { width:100%; height:100%; display:block; }
  #global-filter-buttons { display:none; align-items:center; gap:6px; }
  .app-footer { flex-shrink:0; display:flex; background:rgba(255,255,255,.97); border-top:1px solid rgba(0,0,0,.08); }
  .footer-item { flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; padding:8px 0; background:none; border:none; font-size:max(${header.minFontSize}px,10px); color:#94a3b8; cursor:pointer; }
  .footer-item .ficon { display:flex; }
  .footer-item.active { color:var(--icon-color, #00693A); font-weight:700; }
  .footer-item.active .ficon { color:var(--icon-color, #009845); }
  .hidden-menu-panel { position:fixed; top:0; bottom:0; left:0; width:min(78%,300px); background:#161616; z-index:60; display:flex; flex-direction:column; transform:translateX(-100%); transition:transform .25s ease; }
  .hidden-menu-panel.open { transform:translateX(0); }
  .hidden-menu-head { display:flex; align-items:center; justify-content:space-between; padding:16px; border-bottom:1px solid rgba(255,255,255,.08); flex-shrink:0; }
  .hidden-menu-title { font-size:max(${header.minFontSize}px,12px); font-weight:800; text-transform:uppercase; letter-spacing:.05em; color:var(--icon-color,#009845); }
  .hidden-menu-close { background:none; border:none; cursor:pointer; display:flex; padding:0; }
  .hidden-menu-list { flex:1; overflow-y:auto; }
  .hidden-menu-item { display:flex; align-items:center; gap:10px; padding:14px 16px; cursor:pointer; border-bottom:1px solid rgba(255,255,255,.06); }
  .hidden-menu-item .micon { width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; background:var(--icon-color,#009845); color:#1a1a1a; }
  .hidden-menu-item .mlabel { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:max(${header.minFontSize}px,13px); font-weight:600; color:#f5f5f5; }
  .hidden-menu-item .mchev { color:var(--icon-color,#009845); flex-shrink:0; }
  .hidden-menu-item.active .micon { background:var(--active-icon-bg,#fff); color:#1a1a1a; }
  .hidden-menu-item.active .mlabel { color:var(--icon-color,#009845); font-weight:700; }
  .menu-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:59; display:none; }
  .menu-backdrop.open { display:block; }
  @media (orientation: landscape) { #app-shell { height:100vh; height:100dvh; } }
</style>
</head>
<body>
<div id="app-shell">
  <div id="global-header" style="background:${esc(header.bgColor || '#FFFFFF')};color:${esc(header.textColor || '#1E1E1E')};">
    <div class="gh-zone left"><button class="icon-btn" id="global-menu-btn" onclick="toggleHiddenMenu()" style="display:none;">${MENU_SVG}</button>${zoneContent.left}</div>
    <div class="gh-zone center">${zoneContent.center}</div>
    <div class="gh-zone right">${zoneContent.right}${filterButtonsHtml}<button class="icon-btn" id="global-filter-btn" style="display:none;">${FILTER_SVG}</button><button class="icon-btn" id="global-info-btn" style="display:none;">${INFO_SVG}</button></div>
  </div>
  <div id="tabs-viewport">
${sections}
  </div>
  ${footerNavHtml}
</div>
${hiddenMenuHtml}
${infoPopupsHtml}
${filterPanelHtml}
${filterBackdrop}
<script>
  const TAB_COUNT = ${tabs.length};
  const TAB_META = ${JSON.stringify(tabs.map(t => ({ id: t.id, infoEnabled: !!(t.info && t.info.enabled), isWelcome: t.type === 'welcome' })))};
  const FILTER_ENABLED = ${header.filterEnabled ? 'true' : 'false'};
  let currentIdx = 0;

  function recomputeHeaderHeight() {
    requestAnimationFrame(() => {
      const gh = document.getElementById('global-header');
      const ghH = gh ? gh.offsetHeight : 0;
      const activeSection = document.getElementById('tab-' + currentIdx);
      const arow = activeSection ? activeSection.querySelector('.analytics-header') : null;
      document.documentElement.style.setProperty('--global-header-h', ghH + 'px');
      document.documentElement.style.setProperty('--header-h', (ghH + (arow ? arow.offsetHeight : 0)) + 'px');
    });
  }

  function mountEmbed(container) {
    if (!container || container.dataset.mounted === '1') return;
    var el = document.createElement('qlik-embed');
    el.setAttribute('ui', container.dataset.ui);
    el.setAttribute('app-id', container.dataset.appId || '');
    if (container.dataset.objectId) el.setAttribute('object-id', container.dataset.objectId);
    container.appendChild(el);
    container.dataset.mounted = '1';
  }
  function mountAllIn(scope) {
    if (!scope) return;
    scope.querySelectorAll('[data-lazy-embed]').forEach(mountEmbed);
  }

  function showTab(idx) {
    currentIdx = idx;
    for (let i = 0; i < TAB_COUNT; i++) { const el = document.getElementById('tab-' + i); if (el) el.style.display = (i === idx) ? 'flex' : 'none'; }
    document.querySelectorAll('.footer-item').forEach((btn, i) => btn.classList.toggle('active', i === idx));
    document.querySelectorAll('.hidden-menu-item').forEach((el, i) => el.classList.toggle('active', i === idx));
    const meta = TAB_META[idx];
    const infoBtn = document.getElementById('global-info-btn');
    if (infoBtn) { infoBtn.style.display = meta.infoEnabled ? 'flex' : 'none'; infoBtn.onclick = function () { toggleInfoPopup(meta.id); }; }
    const showFilterHere = FILTER_ENABLED && !meta.isWelcome;
    const filterBtn = document.getElementById('global-filter-btn');
    if (filterBtn) { filterBtn.style.display = showFilterHere ? 'flex' : 'none'; filterBtn.onclick = function () { toggleFilterPanel(); }; }
    const filterBtns = document.getElementById('global-filter-buttons');
    if (filterBtns) { filterBtns.style.display = showFilterHere ? 'inline-flex' : 'none'; if (showFilterHere) mountAllIn(filterBtns); }
    document.querySelectorAll('.info-popup').forEach(p => { if (p.id !== 'info-popup-' + meta.id) p.style.display = 'none'; });
    if (!showFilterHere) {
      const panel = document.getElementById('global-filter-panel');
      const backdrop = document.getElementById('filter-backdrop');
      if (panel) panel.classList.remove('open');
      if (backdrop) backdrop.classList.remove('open');
    }
    recomputeHeaderHeight();
  }
  function nextTab(idx) { showTab(Math.min(idx + 1, TAB_COUNT - 1)); }
  function prevTab(idx) { showTab(Math.max(idx - 1, 0)); }

  function toggleExpand(objId) {
    const el = document.getElementById('obj-' + objId);
    if (!el) return;
    const isMin = el.classList.contains('obj-minimized');
    const expanding = !el.classList.contains('obj-expanded');
    if (expanding) recomputeHeaderHeight();
    el.classList.toggle('obj-expanded');
    if (!isMin) {
      const btn = el.querySelector('.obj-expand-btn');
      if (btn) { btn.innerHTML = expanding ? '${REDUCE_SVG}' : '${EXPAND_SVG}'; btn.setAttribute('aria-label', expanding ? 'Reducir' : 'Ampliar'); }
    }
  }
  function toggleInfoPopup(tabId) {
    const el = document.getElementById('info-popup-' + tabId);
    if (el) el.style.display = (el.style.display === 'none' || !el.style.display) ? 'flex' : 'none';
  }
  function toggleFilterPanel() {
    const el = document.getElementById('global-filter-panel');
    const backdrop = document.getElementById('filter-backdrop');
    const opening = el && !el.classList.contains('open');
    if (el) el.classList.toggle('open');
    if (backdrop) backdrop.classList.toggle('open');
    if (opening) mountAllIn(el);
  }
  function toggleHiddenMenu() {
    const el = document.getElementById('hidden-menu-panel');
    const backdrop = document.getElementById('menu-backdrop');
    if (el) el.classList.toggle('open');
    if (backdrop) backdrop.classList.toggle('open');
  }

  const backdropEl = document.getElementById('filter-backdrop');
  if (backdropEl) backdropEl.addEventListener('click', function () { const panel = document.getElementById('global-filter-panel'); if (panel) panel.classList.remove('open'); backdropEl.classList.remove('open'); });
  const menuBtnEl = document.getElementById('global-menu-btn');
  if (menuBtnEl) menuBtnEl.style.display = ${header.navStyle === 'hidden-top' ? "'flex'" : "'none'"};
  showTab(0);
  window.addEventListener('resize', recomputeHeaderHeight);
  window.addEventListener('orientationchange', recomputeHeaderHeight);
</script>
</body>
</html>`;
}

function ExportButton({ global, header, tabs, label, lang }) {
  function handleExport() {
    const html = generateIndexHtml(global, header, tabs, lang);
    if (global.authType === 'oauth2' && global.generateOauthCallback) {
      // Bundled as a single .zip: browsers silently block a second automatic
      // download, so this is the only way to reliably deliver both files at once.
      const zip = buildZip([
        { name: 'index.html', content: html },
        { name: 'oauth-callback.html', content: buildOauthCallback(global) }
      ]);
      downloadBlob('mashup-export.zip', zip);
    } else {
      download('index.html', html);
    }
  }
  return <button onClick={handleExport} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium"><Download size={13} /> {label}</button>;
}
