const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");

// ---- palette ----
const INK = "141414", ORANGE = "FF6200", ORANGED = "CC4E00";
const WHITE = "FFFFFF", MUTED = "6B7280", LINE = "E5E7EB";
const TINT = "FFF3E9", CARD = "FFFFFF", LIGHT = "F7F8FA";
const GREEN = "12A150", RED = "E5484D", GREY = "9AA0AA";

async function icon(Comp, color, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(Comp, { color, size: String(size) }));
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + png.toString("base64");
}
const shadow = () => ({ type: "outer", color: "000000", blur: 7, offset: 3, angle: 90, opacity: 0.10 });

(async () => {
  const P = new pptxgen();
  P.defineLayout({ name: "W", width: 13.333, height: 7.5 });
  P.layout = "W";
  P.author = "PostNL DevDay"; P.title = "Agentic Commerce — aanpak";

  const W = 13.333;
  // preload icons
  const ic = {
    bolt: await icon(fa.FaBolt, "#" + ORANGE),
    noui: await icon(fa.FaEyeSlash, "#" + ORANGE),
    trust: await icon(fa.FaFingerprint, "#" + ORANGE),
    cart: await icon(fa.FaShoppingBag, "#" + ORANGE),
    watch: await icon(fa.FaClock, "#" + ORANGE),
    check: await icon(fa.FaCheckCircle, "#" + GREEN),
    channels: await icon(fa.FaComments, "#" + ORANGE),
    plug: await icon(fa.FaPlug, "#" + ORANGE),
    robot: await icon(fa.FaRobot, "#" + ORANGE),
    mic: await icon(fa.FaMicrophone, "#" + ORANGE),
    users: await icon(fa.FaUserCheck, "#" + ORANGE),
    bug: await icon(fa.FaShieldAlt, "#" + ORANGE),
    box: await icon(fa.FaBoxOpen, "#" + RED),
    euro: await icon(fa.FaEuroSign, "#" + RED),
    link: await icon(fa.FaUnlink, "#" + RED),
    map: await icon(fa.FaMapMarkerAlt, "#" + RED),
    target: await icon(fa.FaBullseye, "#" + ORANGE),
    voice: await icon(fa.FaHeadset, "#" + ORANGE),
    ruler: await icon(fa.FaCompressArrowsAlt, "#" + ORANGE),
    handoff: await icon(fa.FaHandshake, "#" + ORANGE),
    phone: await icon(fa.FaMobileAlt, "#" + ORANGE),
    sync: await icon(fa.FaSyncAlt, "#" + ORANGE),
    lock: await icon(fa.FaLock, "#" + ORANGE),
    hourglass: await icon(fa.FaHourglassHalf, "#" + RED),
  };

  const logo = (s, x, y) => {
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y, w: 1.35, h: 0.5, fill: { color: ORANGE }, rectRadius: 0.08 });
    s.addText("PostNL", { x, y, w: 1.35, h: 0.5, align: "center", valign: "middle", color: WHITE, bold: true, fontFace: "Arial", fontSize: 16, margin: 0 });
  };
  const card = (s, x, y, w, h, fill) => s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill || CARD }, line: { color: LINE, width: 1 }, rectRadius: 0.09, shadow: shadow() });
  const kicker = (s, t) => s.addText(t.toUpperCase(), { x: 0.6, y: 0.5, w: 9, h: 0.35, color: ORANGED, bold: true, fontFace: "Arial", fontSize: 13, charSpacing: 2, margin: 0 });
  const title = (s, t) => s.addText(t, { x: 0.6, y: 0.82, w: 12, h: 0.9, color: INK, bold: true, fontFace: "Arial", fontSize: 34, margin: 0 });

  // ---------- Slide 1: title ----------
  let s = P.addSlide(); s.background = { color: INK };
  logo(s, 0.6, 0.6);
  s.addText("DevDay 2026 · Track 2", { x: 0.6, y: 2.0, w: 10, h: 0.4, color: GREY, fontFace: "Arial", fontSize: 15, charSpacing: 2, margin: 0 });
  s.addText([
    { text: "Agentic Commerce ", options: { color: WHITE } },
    { text: "× PostNL", options: { color: ORANGE } },
  ], { x: 0.6, y: 2.45, w: 12, h: 1.4, bold: true, fontFace: "Arial", fontSize: 54, margin: 0 });
  s.addText("Hoe vlieg je dit aan? Een agent die niet adviseert, maar écht koopt.", { x: 0.62, y: 3.9, w: 11, h: 0.5, color: "D5D8DD", fontFace: "Arial", fontSize: 20, margin: 0 });
  s.addImage({ data: ic.watch, x: 0.62, y: 5.25, w: 0.4, h: 0.4 });
  s.addText("De agent regelt alles autonoom. De mens tikt één keer.", { x: 1.12, y: 5.2, w: 11, h: 0.55, italic: true, color: ORANGE, bold: true, fontFace: "Arial", fontSize: 20, margin: 0 });

  // ---------- Slide 2: de opdracht ----------
  s = P.addSlide(); s.background = { color: WHITE };
  kicker(s, "De opdracht"); title(s, "Order afronden — zonder webshop in beeld");
  s.addText([
    { text: "Laat een agent de ", options: {} },
    { text: "volledige orderflow", options: { bold: true, color: ORANGED } },
    { text: " doorlopen — van cadeau zoeken tot betaalbare order — ", options: {} },
    { text: "zonder de UI van de webshop ook maar één keer te openen.", options: { bold: true } },
  ], { x: 0.6, y: 1.95, w: 8.1, h: 1.7, color: INK, fontFace: "Arial", fontSize: 23, lineSpacingMultiple: 1.15, margin: 0 });

  const bd = [
    { i: ic.noui, h: "Geen UI", t: "De agent praat met commerce-API's, niet met schermen." },
    { i: ic.cart, h: "Echte transactie", t: "Geen slides — een live order die betaald wordt." },
    { i: ic.trust, h: "Vertrouwen = kern", t: "Hoe de mens 'ja' geeft telt net zo zwaar als de techniek." },
  ];
  bd.forEach((b, k) => {
    const y = 4.0 + k * 1.05;
    s.addImage({ data: b.i, x: 0.6, y: y + 0.05, w: 0.5, h: 0.5 });
    s.addText(b.h, { x: 1.25, y: y - 0.05, w: 7.4, h: 0.4, bold: true, color: INK, fontFace: "Arial", fontSize: 17, margin: 0 });
    s.addText(b.t, { x: 1.25, y: y + 0.33, w: 7.4, h: 0.4, color: MUTED, fontFace: "Arial", fontSize: 14, margin: 0 });
  });
  card(s, 9.15, 2.0, 3.55, 4.9, TINT);
  s.addText("Succesvol als…", { x: 9.45, y: 2.25, w: 3, h: 0.4, bold: true, color: ORANGED, fontFace: "Arial", fontSize: 15, margin: 0 });
  s.addText([
    { text: "complete order, geen UI", options: { bullet: true, breakLine: true } },
    { text: "slim, vertrouwenwekkend akkoord", options: { bullet: true, breakLine: true } },
    { text: "PostNL Checkout speelt een échte rol", options: { bullet: true, breakLine: true } },
    { text: "je legt uit waar het wél/niet werkt", options: { bullet: true } },
  ], { x: 9.45, y: 2.75, w: 3.05, h: 4.0, color: INK, fontFace: "Arial", fontSize: 15, paraSpaceAfter: 12, margin: 0 });

  // ---------- Slide 3: mentaal model 8 -> 1 ----------
  s = P.addSlide(); s.background = { color: LIGHT };
  kicker(s, "Het mentale model"); title(s, "Autonoom tot aan het geld");
  const steps = ["Intentie", "Discovery", "Voorstel", "Cart", "Bezorging", "Checkout init", "HÉT moment", "Bevestiging"];
  const cw = 1.42, gap = 0.12, x0 = 0.6;
  steps.forEach((st, k) => {
    const x = x0 + k * (cw + gap);
    const human = k === 6;
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y: 2.1, w: cw, h: 1.5, fill: { color: human ? ORANGE : CARD }, line: { color: human ? ORANGE : LINE, width: 1 }, rectRadius: 0.08, shadow: shadow() });
    s.addText(String(k + 1), { x, y: 2.25, w: cw, h: 0.4, align: "center", bold: true, color: human ? WHITE : "C3C7CE", fontFace: "Arial", fontSize: 16, margin: 0 });
    s.addText(st, { x: x + 0.05, y: 2.7, w: cw - 0.1, h: 0.8, align: "center", valign: "top", bold: human, color: human ? WHITE : INK, fontFace: "Arial", fontSize: 12.5, margin: 0 });
    if (human) s.addText("mens", { x, y: 3.28, w: cw, h: 0.3, align: "center", italic: true, color: "FFE1CC", fontFace: "Arial", fontSize: 11, margin: 0 });
  });
  card(s, 0.6, 4.15, 5.6, 2.6, INK);
  s.addText([{ text: "8", options: { color: WHITE } }, { text: "  →  ", options: { color: GREY } }, { text: "1", options: { color: ORANGE } }],
    { x: 0.8, y: 4.45, w: 5.2, h: 1.4, bold: true, fontFace: "Arial", fontSize: 66, align: "center", margin: 0 });
  s.addText("stappen  →  één menselijke tik", { x: 0.8, y: 5.9, w: 5.2, h: 0.5, align: "center", color: "D5D8DD", fontFace: "Arial", fontSize: 17, margin: 0 });
  s.addText([
    { text: "Alles vóór stap 7 doet de agent zelf: ", options: { bold: true } },
    { text: "zoeken via GraphQL, kiezen, cart vullen, levertijd checken en PostNL Fast Checkout initiëren. ", options: {} },
    { text: "Adres én betaling zitten in PostNL Checkout — de agent verzamelt ze niet. ", options: {} },
    { text: "Wat overblijft voor de mens: één bevestiging in de PostNL-app.", options: { bold: true, color: ORANGED } },
  ], { x: 6.5, y: 4.25, w: 6.2, h: 2.5, color: INK, fontFace: "Arial", fontSize: 16.5, lineSpacingMultiple: 1.15, valign: "top", margin: 0 });

  // ---------- Slide 4: één moment (compare) ----------
  s = P.addSlide(); s.background = { color: WHITE };
  kicker(s, "De sleutelzet"); title(s, "Vouw akkoord + betaling samen tot één moment");
  // left (meh)
  card(s, 0.6, 2.0, 5.85, 4.5, LIGHT);
  s.addText("✗  Twee losse momenten", { x: 0.9, y: 2.25, w: 5.3, h: 0.5, bold: true, color: MUTED, fontFace: "Arial", fontSize: 18, margin: 0 });
  s.addText([
    { text: "Agent vraagt apart om 'ja'", options: { bullet: true, breakLine: true } },
    { text: "Daarna een aparte betaalstap", options: { bullet: true, breakLine: true } },
    { text: "Twee handelingen, twee kansen om af te haken", options: { bullet: true, breakLine: true } },
    { text: "PostNL Checkout voelt als afterthought", options: { bullet: true } },
  ], { x: 0.95, y: 3.0, w: 5.2, h: 3.2, color: "4B5563", fontFace: "Arial", fontSize: 16, paraSpaceAfter: 14, margin: 0 });
  // right (win)
  card(s, 6.85, 2.0, 5.85, 4.5, TINT);
  s.addImage({ data: ic.check, x: 7.15, y: 2.25, w: 0.42, h: 0.42 });
  s.addText("Eén moment: PostNL Fast Checkout", { x: 7.65, y: 2.25, w: 4.8, h: 0.5, bold: true, color: ORANGED, fontFace: "Arial", fontSize: 18, margin: 0 });
  s.addText([
    { text: "Eén bevestiging in de PostNL-app = akkoord + betaling", options: { bullet: true, breakLine: true } },
    { text: "De nudge (Garmin / WhatsApp) opent de deeplink", options: { bullet: true, breakLine: true } },
    { text: "Adres + betaling staan al in PostNL Checkout", options: { bullet: true, breakLine: true } },
    { text: "De agent draagt alleen de link over — betaalt nooit zelf", options: { bullet: true } },
  ], { x: 7.2, y: 3.0, w: 5.25, h: 3.2, color: INK, fontFace: "Arial", fontSize: 16, paraSpaceAfter: 14, margin: 0 });
  s.addText("De nudge (bv. op je Garmin) brengt de mens naar dat ene moment — hij ís niet het akkoord zelf.",
    { x: 0.6, y: 6.75, w: 12.1, h: 0.5, italic: true, color: MUTED, fontFace: "Arial", fontSize: 14, align: "center", margin: 0 });

  // ---------- Slide: je krijgt alleen een link ----------
  s = P.addSlide(); s.background = { color: WHITE };
  kicker(s, "PostNL Fast Checkout"); title(s, "Je krijgt alléén een link");
  // flow strip
  const fb = [
    "POST  /postnl_fastcheckout/checkout/init",
    "orderId  PNL-a1b2c3d4   +   checkoutUrl",
    "deeplink → PostNL-app → bevestiging",
  ];
  const fbw = 3.9, fgap = 0.35;
  fb.forEach((t, k) => {
    const x = 0.6 + k * (fbw + fgap);
    s.addShape(P.shapes.ROUNDED_RECTANGLE, { x, y: 1.95, w: fbw, h: 1.05, fill: { color: k === 2 ? TINT : LIGHT }, line: { color: LINE, width: 1 }, rectRadius: 0.08, shadow: shadow() });
    s.addText(t, { x: x + 0.15, y: 1.95, w: fbw - 0.3, h: 1.05, align: "center", valign: "middle", color: k === 2 ? ORANGED : INK, bold: k === 2, fontFace: "Courier New", fontSize: 12.5, margin: 0 });
    if (k < 2) s.addText("→", { x: x + fbw - 0.02, y: 1.95, w: fgap + 0.04, h: 1.05, align: "center", valign: "middle", color: ORANGE, bold: true, fontFace: "Arial", fontSize: 24, margin: 0 });
  });
  const link = [
    { i: ic.handoff, h: "Agent betaalt niet", t: "Krijgt alleen de checkoutUrl deeplink terug en draagt die over. Geen kaartgegevens, geen betaalrechten." },
    { i: ic.phone, h: "Adres + betaling in de app", t: "De klant bevestigt adres én betaalmethode in PostNL Checkout — niet bij de agent." },
    { i: ic.sync, h: "Bevestiging is asynchroon", t: "De agent weet niet meteen of 't lukte. Poll de orderstatus of luister naar een webhook — nooit een 'betaald' verzinnen." },
    { i: ic.bug, h: "Technische gotchas", t: "Min. cartwaarde €5,00 · sessie-cart via PHPSESSID (geen GraphQL-cart) · alleen SimpleProducts." },
  ];
  link.forEach((o, k) => {
    const x = 0.6 + (k % 2) * 6.25, y = 3.5 + Math.floor(k / 2) * 1.72;
    card(s, x, y, 5.95, 1.55);
    s.addShape(P.shapes.OVAL, { x: x + 0.28, y: y + 0.35, w: 0.82, h: 0.82, fill: { color: TINT } });
    s.addImage({ data: o.i, x: x + 0.48, y: y + 0.55, w: 0.42, h: 0.42 });
    s.addText(o.h, { x: x + 1.32, y: y + 0.24, w: 4.4, h: 0.4, bold: true, color: INK, fontFace: "Arial", fontSize: 16, margin: 0 });
    s.addText(o.t, { x: x + 1.32, y: y + 0.66, w: 4.45, h: 0.82, color: MUTED, fontFace: "Arial", fontSize: 12.5, margin: 0 });
  });

  // ---------- Slide 5: waarom OpenClaw ----------
  s = P.addSlide(); s.background = { color: LIGHT };
  kicker(s, "De tooling"); title(s, "Waarom OpenClaw?");
  const oc = [
    { i: ic.channels, h: "Multi-channel out-of-the-box", t: "Slack, WhatsApp, Telegram, voice — geen webhook-plumbing zelf bouwen." },
    { i: ic.plug, h: "MCP-host", t: "Draait de commerce-skill en postnl-mcp als processen; regelt de tool-calling." },
    { i: ic.robot, h: "De agent-runtime zelf", t: "Sessies, routing, secrets, een langlopende agent die op je kanalen luistert." },
    { i: ic.mic, h: "Gemini + voice ingebouwd", t: "Gemini 2.5 Flash + Gemini Live (Talk) zijn al geconfigureerd." },
  ];
  oc.forEach((o, k) => {
    const x = 0.6 + (k % 2) * 6.25, y = 2.05 + Math.floor(k / 2) * 1.75;
    card(s, x, y, 5.95, 1.55);
    s.addShape(P.shapes.OVAL, { x: x + 0.28, y: y + 0.35, w: 0.85, h: 0.85, fill: { color: TINT } });
    s.addImage({ data: o.i, x: x + 0.5, y: y + 0.57, w: 0.42, h: 0.42 });
    s.addText(o.h, { x: x + 1.35, y: y + 0.28, w: 4.4, h: 0.5, bold: true, color: INK, fontFace: "Arial", fontSize: 16.5, margin: 0 });
    s.addText(o.t, { x: x + 1.35, y: y + 0.72, w: 4.45, h: 0.7, color: MUTED, fontFace: "Arial", fontSize: 13.5, margin: 0 });
  });
  s.addText([
    { text: "Eerlijk: ", options: { bold: true, color: ORANGED } },
    { text: "een middel, geen doel. Voor één kanaal + één flow is een klein script genoeg. De winst komt bij meerdere kanalen, voice en MCP-tools. Kun je uitleggen waaróm je 't wel/niet nodig hebt → je scoort.", options: {} },
  ], { x: 0.6, y: 5.7, w: 12.1, h: 1.1, color: INK, fontFace: "Arial", fontSize: 14.5, align: "center", margin: 0 });

  // ---------- Slide 6: waar steek je je uren in ----------
  s = P.addSlide(); s.background = { color: WHITE };
  kicker(s, "Aanpak"); title(s, "Waar steek je je uren in?");
  const hints = [
    { i: ic.users, h: "User-in-the-loop eerst", t: "Kies in het eerste uur: op welk moment, via welk kanaal, geeft de mens 'ja' — en waarom vertrouwt die het?" },
    { i: ic.bug, h: "Demo de unhappy paths", t: "Een agent die weigert ('bedrag klopt niet') maakt méér indruk dan een gladde happy-path." },
    { i: ic.voice, h: "Voice is een valstrik", t: "Gemini Live oogt cool maar is fragiel. Eerst tekst/Slack rock-solid, voice als laatste." },
    { i: ic.ruler, h: "Scope-discipline", t: "Eén scenario écht af > drie half. 'Snel cadeau in < 2 min' compleet wint van 60% multi-channel." },
    { i: ic.handoff, h: "PostNL Checkout = vertrouwensschakel", t: "Niet als betaallink, maar als het moment waarop de mens de controle terugpakt." },
  ];
  hints.forEach((o, k) => {
    let x, y, w2 = 3.86, h2 = 2.05;
    if (k < 3) { x = 0.6 + k * (w2 + 0.19); y = 2.0; }
    else { w2 = 5.85; x = 0.6 + (k - 3) * (w2 + 0.4); y = 4.35; }
    card(s, x, y, w2, h2, k >= 3 ? TINT : CARD);
    s.addImage({ data: o.i, x: x + 0.3, y: y + 0.3, w: 0.5, h: 0.5 });
    s.addText(o.h, { x: x + 0.3, y: y + 0.9, w: w2 - 0.55, h: 0.5, bold: true, color: INK, fontFace: "Arial", fontSize: 15.5, margin: 0 });
    s.addText(o.t, { x: x + 0.3, y: y + (k < 3 ? 1.35 : 1.3), w: w2 - 0.55, h: 0.65, color: MUTED, fontFace: "Arial", fontSize: 12.5, margin: 0 });
  });

  // ---------- Slide 7: guardrails ----------
  s = P.addSlide(); s.background = { color: LIGHT };
  kicker(s, "Robuustheid"); title(s, "Guardrails & failure modes");
  s.addText("Bouw expliciete fallback-paden — dat maakt indruk bij de jury.", { x: 0.6, y: 1.72, w: 11, h: 0.4, color: MUTED, fontFace: "Arial", fontSize: 15, italic: true, margin: 0 });
  const gr = [
    { i: ic.box, h: "Niet op voorraad", t: "Agent voegt niet toe, stelt een andere variant of alternatief voor." },
    { i: ic.euro, h: "Bedrag klopt niet", t: "'Ja' maar totaal wijkt af → agent bestelt niet, vraagt opnieuw akkoord." },
    { i: ic.link, h: "Deeplink verlopen", t: "Agent init opnieuw een checkout i.p.v. de mens te laten vastlopen." },
    { i: ic.hourglass, h: "Bevestiging blijft uit", t: "Async: agent polt de orderstatus / wacht op webhook — nooit gokken dat 't betaald is." },
  ];
  gr.forEach((o, k) => {
    const x = 0.6 + (k % 2) * 6.25, y = 2.35 + Math.floor(k / 2) * 2.15;
    card(s, x, y, 5.95, 1.9);
    s.addImage({ data: o.i, x: x + 0.32, y: y + 0.35, w: 0.5, h: 0.5 });
    s.addText(o.h, { x: x + 1.0, y: y + 0.33, w: 4.7, h: 0.5, bold: true, color: INK, fontFace: "Arial", fontSize: 17, margin: 0 });
    s.addText(o.t, { x: x + 1.0, y: y + 0.85, w: 4.75, h: 0.85, color: MUTED, fontFace: "Arial", fontSize: 14, margin: 0 });
  });

  // ---------- Slide 8: closing ----------
  s = P.addSlide(); s.background = { color: INK };
  logo(s, 0.6, 0.6);
  s.addText("Wat indruk maakt op de jury", { x: 0.6, y: 1.9, w: 12, h: 0.9, bold: true, color: WHITE, fontFace: "Arial", fontSize: 38, margin: 0 });
  const crit = [
    "End-to-end order zonder webshop-UI",
    "Vertrouwen & een slimme user-in-the-loop",
    "PostNL Checkout als échte schakel, niet afterthought",
    "Zichtbare guardrails & failure modes",
    "Originaliteit & realisme — echte real-life situaties",
  ];
  crit.forEach((c, k) => {
    const y = 2.9 + k * 0.66;
    s.addImage({ data: ic.check, x: 0.65, y: y + 0.02, w: 0.38, h: 0.38 });
    s.addText(c, { x: 1.18, y, w: 11.4, h: 0.48, color: "E7E9ED", fontFace: "Arial", fontSize: 18.5, margin: 0 });
  });
  s.addText("Één tik van de mens. De rest doet de agent.", { x: 0.6, y: 6.5, w: 12, h: 0.6, italic: true, bold: true, color: ORANGE, fontFace: "Arial", fontSize: 22, margin: 0 });

  await P.writeFile({ fileName: "/sessions/festive-practical-faraday/mnt/outputs/deckbuild/aanpak.pptx" });
  console.log("written");
})();
