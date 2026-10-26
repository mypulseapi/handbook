import type { Answer } from "./answer";

/**
 * The conversational layer, checked before any retrieval.
 *
 * Users typed "hi" and got "I could not find that in the documentation", because no page contains
 * a greeting. This answers what a person says to an assistant, greetings, thanks, "what can you
 * do", and the product's own vocabulary, in plain words, before the search runs.
 *
 * **Still nothing generated.** Every reply is a fixed, reviewed sentence, so the guarantee in
 * answer.ts holds: no invented endpoint, figure or claim. Small talk needs no model, so it answers
 * at once, even while the model is still downloading.
 *
 * The same code is in peacock (`src/lib/assistant/`) and handbook (`lib/assistant/`), differing only
 * in each repository's Prettier quotes. Change both or neither: ODIN/engineering/SITES.md § 3.
 */

export interface Origins {
  /** The marketing site, no locale, e.g. https://thepulseapi.com */
  site: string;
  /** The developer handbook, e.g. https://developer.thepulseapi.com */
  docs: string;
}

/**
 * Both sites, from the variables both repositories already set (each one's `.env.example`).
 * Trailing slashes off, so a link is never `//vi`.
 */
export const ORIGINS: Origins = {
  site: (process.env.NEXT_PUBLIC_SITE_URL || "https://thepulseapi.com").replace(
    /\/+$/,
    "",
  ),
  docs: (
    process.env.NEXT_PUBLIC_DOCS_URL || "https://developer.thepulseapi.com"
  ).replace(/\/+$/, ""),
};

type Lang = "en" | "vi";
type Reply = { en: string; vi: string };

/** Lower case, punctuation off, Vietnamese accents off, so "Xin chào!" and "xin chao" match alike. */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const words = (q: string) => (q ? q.split(" ").length : 0);

function links(o: Origins, lang: Lang) {
  const loc = lang === "vi" ? "/vi" : "/en";
  const docs = lang === "vi" ? `${o.docs}/vi` : o.docs;
  return {
    site: `${o.site}${loc}`,
    pricing: `${o.site}${loc}/pricing`,
    contact: `${o.site}${loc}/contact`,
    docs,
    quickstart: `${docs}/quickstart`,
    api: `${docs}/api`,
    catalogue: `${docs}/catalogue`,
    storefront: `${docs}/storefront`,
  };
}

/* ---------------------------------------------------------------------------
   Small talk: the whole message is the greeting, the thanks, the question about the assistant.
   ------------------------------------------------------------------------- */

const SMALL_TALK: {
  test: RegExp;
  maxWords: number;
  reply: (l: ReturnType<typeof links>) => Reply;
}[] = [
  {
    test: /^(hi+|hello+|hey+|hiya|yo|howdy|greetings|good (morning|afternoon|evening)|xin chao|chao( ban| anh| chi| em)?|alo|helo|hallo)\b/,
    maxWords: 5,
    reply: (l) => ({
      en: `Hi, I'm the Pulse assistant. I can explain what Pulse does, walk you through the API, or point you to pricing.\n\nA few things people ask:\n- What does the Decision Audit measure?\n- How do I send my first request?\n- Which products count toward usage?\n- How does Return Verification work?\n\nOr just ask in your own words. Everything I say comes from [thepulseapi.com](${l.site}) and [the developer docs](${l.docs}).`,
      vi: `Xin chào, tôi là trợ lý của Pulse. Tôi có thể giải thích Pulse làm gì, hướng dẫn bạn dùng API, hoặc chỉ bạn tới bảng giá.\n\nMột vài câu mọi người hay hỏi:\n- Decision Audit đo những gì?\n- Gửi yêu cầu đầu tiên như thế nào?\n- Sản phẩm nào được tính vào mức sử dụng?\n- Return Verification hoạt động ra sao?\n\nHoặc cứ hỏi theo cách của bạn. Mọi câu trả lời đều lấy từ [thepulseapi.com](${l.site}) và [tài liệu cho lập trình viên](${l.docs}).`,
    }),
  },
  {
    test: /^(how are you|how s it going|how are things|ban (co )?khoe khong|ban the nao)\b/,
    maxWords: 6,
    reply: () => ({
      en: "Doing well, thanks for asking. What would you like to know about Pulse? I can help with the products, the API, or pricing.",
      vi: "Tôi ổn, cảm ơn bạn đã hỏi. Bạn muốn biết gì về Pulse? Tôi có thể giúp về sản phẩm, API hoặc bảng giá.",
    }),
  },
  {
    test: /^(thanks?|thank you|thx|ty|cheers|great thanks|perfect|awesome|cam on|cam on ban|tuyet voi)\b/,
    maxWords: 6,
    reply: () => ({
      en: "You're welcome. Ask me anything else whenever you like.",
      vi: "Không có gì. Bạn cần gì thêm cứ hỏi nhé.",
    }),
  },
  {
    test: /^(bye|goodbye|see you|see ya|later|tam biet|hen gap lai)\b/,
    maxWords: 5,
    reply: (l) => ({
      en: `Goodbye. When you're ready to try it, [request an audit](${l.contact}) or start with the [quick start](${l.quickstart}).`,
      vi: `Tạm biệt. Khi bạn sẵn sàng, hãy [yêu cầu kiểm tra](${l.contact}) hoặc bắt đầu với [hướng dẫn nhanh](${l.quickstart}).`,
    }),
  },
  {
    test: /^(what can you do|what do you do|who are you|what are you|are you (a )?(bot|human|ai|real)|help|help me|can you help|ban la ai|ban lam duoc gi|ban giup gi duoc|giup toi)\b/,
    maxWords: 8,
    reply: (l) => ({
      en: `I answer questions about Pulse from our own pages: the products, how to integrate the API, and what it costs. I'm not a general chatbot, and I quote the site rather than make things up, with a link to where each answer came from.\n\nTry:\n- What is Pulse?\n- Which product should I start with?\n- How do I get an API key?\n- What does it cost?\n\nIf you would rather talk to a person, [contact the team](${l.contact}).`,
      vi: `Tôi trả lời câu hỏi về Pulse từ chính các trang của chúng tôi: sản phẩm, cách tích hợp API và chi phí. Tôi không phải chatbot đa năng; tôi trích dẫn từ trang chứ không tự bịa, kèm liên kết tới nơi có câu trả lời.\n\nThử hỏi:\n- Pulse là gì?\n- Nên bắt đầu với sản phẩm nào?\n- Lấy API key như thế nào?\n- Chi phí bao nhiêu?\n\nNếu muốn nói chuyện với người thật, hãy [liên hệ đội ngũ](${l.contact}).`,
    }),
  },
  {
    test: /^(talk to|speak to|contact|call|email) ?(a |the )?(human|person|someone|sales|team|support)?|^(lien he|gap nhan vien|noi chuyen voi nguoi)\b/,
    maxWords: 8,
    reply: (l) => ({
      en: `Happy to put you in touch. The [contact page](${l.contact}) reaches the people who do the work, usually with a reply the same working day.`,
      vi: `Rất sẵn lòng kết nối bạn. [Trang liên hệ](${l.contact}) sẽ tới thẳng những người trực tiếp làm việc, thường được trả lời ngay trong ngày làm việc.`,
    }),
  },
];

/* ---------------------------------------------------------------------------
   The vocabulary: what a term means, in a sentence, and where to read more.
   Answered when the question is about the term itself ("what is X", "X là gì", or just "X").
   ------------------------------------------------------------------------- */

const TERMS: {
  names: string[];
  any?: boolean;
  reply: (l: ReturnType<typeof links>) => Reply;
}[] = [
  {
    names: ["pulse", "thepulseapi", "pulse api"],
    reply: (l) => ({
      en: `Pulse is a service for e-commerce merchants, made by Resolve Labs. It measures whether your product catalogue can answer the questions shoppers ask before they buy, tells you which missing fact costs the most buying decisions, proves whether each fix worked, and can rank your storefront for each live visit. Every product is an API.\n\nStart with the [catalogue products](${l.catalogue}) or the [storefront products](${l.storefront}).`,
      vi: `Pulse là dịch vụ dành cho người bán thương mại điện tử, do Resolve Labs phát triển. Pulse đo xem danh mục sản phẩm của bạn có trả lời được những câu người mua hỏi trước khi mua hay không, chỉ ra thông tin còn thiếu nào làm mất nhiều quyết định mua nhất, chứng minh mỗi bản sửa có hiệu quả không, và có thể xếp hạng cửa hàng cho từng lượt truy cập. Mỗi sản phẩm là một API.\n\nBắt đầu với [sản phẩm cho danh mục](${l.catalogue}) hoặc [sản phẩm cho cửa hàng](${l.storefront}).`,
    }),
  },
  {
    names: ["decision audit", "audit"],
    reply: (l) => ({
      en: `The **Decision Audit** ranks the missing facts in one category of your catalogue by how many buying decisions each one costs, so your team fixes the right column first, not just the emptiest. You send a CSV to \`POST /catalog/audit\` and get the attributes back in priority order, with where each missing value already lives. [Read more](${l.catalogue}/decision-audit).`,
      vi: `**Decision Audit** xếp hạng các thông tin còn thiếu trong một ngành hàng theo số quyết định mua mà mỗi thông tin làm mất, để đội của bạn sửa đúng cột trước chứ không chỉ cột trống nhất. Bạn gửi một tệp CSV tới \`POST /catalog/audit\` và nhận lại các thuộc tính theo thứ tự ưu tiên, kèm nơi giá trị còn thiếu đang nằm sẵn. [Xem thêm](${l.catalogue}/decision-audit).`,
    }),
  },
  {
    names: ["decision verification", "verification", "verify"],
    reply: (l) => ({
      en: `**Decision Verification** checks a repair. Send the catalogue export from before and after the work, list what was claimed, and \`POST /catalog/verify\` tells you what actually improved, what regressed, and any claim the new export does not bear out. No traffic or A/B test needed. [Read more](${l.catalogue}/decision-verification).`,
      vi: `**Decision Verification** kiểm tra một bản sửa. Gửi bản xuất danh mục trước và sau khi sửa, kèm những gì được cho là đã sửa, và \`POST /catalog/verify\` cho biết điều gì thực sự cải thiện, điều gì tụt lại, và tuyên bố nào bản xuất mới không chứng minh được. Không cần lưu lượng truy cập hay thử nghiệm A/B. [Xem thêm](${l.catalogue}/decision-verification).`,
    }),
  },
  {
    names: ["decision monitor", "monitor", "monitoring"],
    reply: (l) => ({
      en: `**Decision Monitor** compares each new catalogue export with the last one and tells you which shelf slipped and why, before shoppers notice. It is \`POST /catalog/verify\` without any repair claims, run on a schedule from your side. [Read more](${l.catalogue}/decision-monitor).`,
      vi: `**Decision Monitor** so sánh mỗi bản xuất danh mục mới với bản trước và cho biết nhóm hàng nào bị tụt và vì sao, trước khi người mua nhận ra. Đó là \`POST /catalog/verify\` không kèm tuyên bố sửa nào, chạy định kỳ từ phía bạn. [Xem thêm](${l.catalogue}/decision-monitor).`,
    }),
  },
  {
    names: [
      "promotion audit",
      "promotions",
      "promotion",
      "voucher",
      "vouchers",
      "free shipping",
      "khuyen mai",
    ],
    reply: (l) => ({
      en: `The **Promotion Audit** judges your vouchers, price cuts and free-shipping offers on the orders that stayed bought, after returns and failed deliveries, against doing nothing. It says where no offer paid, for how many shoppers, and where fixing the listing beats a discount; where the history is too thin it asks for a test instead of guessing. It runs on your own history through \`POST /interventions/audit\`. [Read more](${l.site}/product/promotion-audit) · [API](${l.docs}/api/v1/interventions).`,
      vi: `**Promotion Audit** đánh giá voucher, giảm giá và miễn phí vận chuyển theo những đơn được giữ lại, sau khi trừ hàng bị trả và giao thất bại, so với việc không làm gì. Nó chỉ ra chỗ nào không ưu đãi nào có lãi, cho bao nhiêu người mua, và chỗ nào sửa trang sản phẩm có lợi hơn giảm giá; khi dữ liệu quá mỏng, nó đề nghị thử nghiệm thay vì đoán. Chạy trên lịch sử của chính bạn qua \`POST /interventions/audit\`. [Xem thêm](${l.site}/product/promotion-audit) · [API](${l.docs}/api/v1/interventions).`,
    }),
  },
  {
    names: ["return verification", "returns", "return"],
    reply: (l) => ({
      en: `**Return Verification** reads your orders and their return reasons against your catalogue. It shows which missing product facts go with returns, whether a repair moved them, and what that was worth at your own costs. You report each order line to \`POST /outcomes\`, which is free. It does not promise fewer returns; it measures your own history. [Read more](${l.catalogue}/return-verification).`,
      vi: `**Return Verification** đối chiếu đơn hàng và lý do trả hàng với danh mục của bạn. Nó cho thấy thông tin sản phẩm còn thiếu nào đi cùng hàng bị trả, bản sửa có làm chúng giảm không, và điều đó đáng giá bao nhiêu theo chi phí của chính bạn. Bạn gửi từng dòng đơn hàng tới \`POST /outcomes\`, miễn phí. Nó không hứa giảm hàng trả; nó đo lịch sử của chính bạn. [Xem thêm](${l.catalogue}/return-verification).`,
    }),
  },
  {
    names: [
      "decision api",
      "live ranking",
      "personalisation",
      "personalization",
      "personalize",
      "personalise",
      "ca nhan hoa",
    ],
    reply: (l) => ({
      en: `The **Decision API** reads an anonymous visit as it happens and works out what the shopper is shopping for, from the pages viewed, filters set and words searched. No login, no cookies, no personal data. Send signals to \`POST /track\`; every ranking call afterwards uses them. [Read more](${l.storefront}/decision-api).`,
      vi: `**Decision API** đọc một lượt truy cập ẩn danh ngay khi nó diễn ra và suy ra người mua đang tìm gì, từ các trang đã xem, bộ lọc đã chọn và từ khoá đã tìm. Không cần đăng nhập, không cookie, không dữ liệu cá nhân. Gửi tín hiệu tới \`POST /track\`; mọi lệnh xếp hạng sau đó đều dùng chúng. [Xem thêm](${l.storefront}/decision-api).`,
    }),
  },
  {
    names: ["pulse search", "search product", "rerank", "reranking"],
    reply: (l) => ({
      en: `**Pulse Search** ranks results on what the shopper is deciding, not only on matching words, and reads the rest of the query too: a budget, who it is for, the occasion. Keep your search engine and reorder its results with \`POST /rerank\`, or rank products you pass in with \`POST /search\`. It reads Vietnamese, Thai, Bahasa and English. [Read more](${l.storefront}/search).`,
      vi: `**Pulse Search** xếp hạng kết quả theo điều người mua đang cân nhắc, không chỉ theo từ khớp, và đọc cả phần còn lại của câu tìm: ngân sách, mua cho ai, dịp gì. Giữ công cụ tìm kiếm hiện tại và sắp xếp lại kết quả bằng \`POST /rerank\`, hoặc xếp hạng sản phẩm bạn gửi vào bằng \`POST /search\`. Hiểu tiếng Việt, Thái, Bahasa và tiếng Anh. [Xem thêm](${l.storefront}/search).`,
    }),
  },
  {
    names: ["recommendations", "recommendation", "goi y"],
    reply: (l) => ({
      en: `**Recommendations** rank a strip against the visit happening now, so a first-time shopper gets relevant picks without any purchase history. Add \`recommendCount\` to \`POST /catalog/ranked\` and the strip comes back with the page. [Read more](${l.storefront}/recommendations).`,
      vi: `**Recommendations** xếp hạng một dải gợi ý theo lượt truy cập đang diễn ra, nên người mua lần đầu cũng nhận được gợi ý phù hợp mà không cần lịch sử mua hàng. Thêm \`recommendCount\` vào \`POST /catalog/ranked\` và dải gợi ý trả về cùng trang. [Xem thêm](${l.storefront}/recommendations).`,
    }),
  },
  {
    names: ["persona", "personas"],
    reply: (l) => ({
      en: `A **persona** is what a session appears to be shopping for, scored from 0 to 1, such as a gift buyer or a budget-led shopper. Pulse infers personas from the visit's signals, never from personal data, and they fade as the visit moves on. [Read more](${l.docs}/concepts/how-it-works).`,
      vi: `**Persona** là điều mà một phiên truy cập có vẻ đang tìm mua, được chấm từ 0 đến 1, ví dụ người mua quà hoặc người mua theo ngân sách. Pulse suy ra persona từ tín hiệu của lượt truy cập, không bao giờ từ dữ liệu cá nhân, và chúng nhạt dần khi lượt truy cập tiếp diễn. [Xem thêm](${l.docs}/concepts/how-it-works).`,
    }),
  },
  {
    names: ["signal", "signals", "tin hieu"],
    reply: (l) => ({
      en: `A **signal** is one thing a visitor did: opened a category, set a price filter, searched for something. You send signals to \`POST /track\` as they happen, and each one sharpens what the session is shopping for. [The signal types](${l.docs}/concepts/signals).`,
      vi: `**Tín hiệu** là một hành động của khách truy cập: mở một ngành hàng, đặt bộ lọc giá, tìm một thứ gì đó. Bạn gửi tín hiệu tới \`POST /track\` ngay khi chúng xảy ra, và mỗi tín hiệu làm rõ hơn phiên truy cập đang tìm gì. [Các loại tín hiệu](${l.docs}/concepts/signals).`,
    }),
  },
  {
    names: ["session", "sessions", "phien"],
    reply: (l) => ({
      en: `A **session** is one anonymous visit, identified by a \`sessionId\` you choose. Pulse keeps what the visit implies for as long as it lasts, with no login and nothing personal stored. [Read more](${l.docs}/concepts/sessions).`,
      vi: `**Phiên truy cập** là một lượt ghé thăm ẩn danh, được nhận diện bằng \`sessionId\` do bạn chọn. Pulse giữ những gì lượt truy cập cho thấy trong suốt thời gian đó, không cần đăng nhập và không lưu gì cá nhân. [Xem thêm](${l.docs}/concepts/sessions).`,
    }),
  },
  {
    names: [
      "holdback",
      "hold back",
      "control arm",
      "control group",
      "nhom doi chung",
    ],
    reply: () => ({
      en: "The **holdback** is a share of visits that is always ranked without Pulse, in your own default order. Comparing the two is how a difference gets measured rather than asserted, and it is why Pulse never asks you to take a lift figure on trust.",
      vi: "**Nhóm đối chứng** là một phần lượt truy cập luôn được xếp theo thứ tự mặc định của bạn, không qua Pulse. So sánh hai nhóm là cách đo khác biệt thay vì chỉ khẳng định, và là lý do Pulse không bao giờ yêu cầu bạn tin một con số tăng trưởng.",
    }),
  },
  {
    names: ["bits", "bit", "decision information"],
    reply: (l) => ({
      en: `**Decision information** is measured in bits. One bit halves the shelf a shopper is choosing from: 216 products down to 108. The audit reports how many bits each attribute would add if it were recorded everywhere, which is why it is not a completeness percentage. [Read more](${l.docs}/concepts/what-the-audit-measures).`,
      vi: `**Thông tin quyết định** được đo bằng bit. Một bit chia đôi kệ hàng người mua đang chọn: từ 216 sản phẩm còn 108. Bản kiểm tra báo mỗi thuộc tính sẽ thêm bao nhiêu bit nếu được ghi đầy đủ, nên nó không phải tỷ lệ phần trăm độ đầy đủ. [Xem thêm](${l.docs}/concepts/what-the-audit-measures).`,
    }),
  },
  {
    names: ["api key", "apikey", "api keys", "publishable key"],
    reply: (l) => ({
      en: `Every request needs an API key in the \`x-api-key\` header. You need a merchant account and a subscription first; then create a key in the dashboard. The three steps are in [Get your account ready](${l.docs}#get-your-account-ready).`,
      vi: `Mỗi yêu cầu cần một API key trong header \`x-api-key\`. Trước hết bạn cần tài khoản người bán và gói đăng ký; sau đó tạo key trong bảng điều khiển. Ba bước nằm trong [Chuẩn bị tài khoản](${l.docs}#get-your-account-ready).`,
    }),
  },
  {
    names: ["sdk", "javascript sdk", "npm"],
    reply: (l) => ({
      en: `The browser SDK, \`@thepulseapi/sdk\` on npm or from our CDN, wraps the storefront calls: \`track()\`, \`getSession()\`, \`search()\`, \`rankedCatalog()\`, \`event()\` and \`exposure()\`. The catalogue products are plain HTTP. [SDK reference](${l.docs}/sdk).`,
      vi: `SDK cho trình duyệt, \`@thepulseapi/sdk\` trên npm hoặc từ CDN của chúng tôi, gói các lệnh cho cửa hàng: \`track()\`, \`getSession()\`, \`search()\`, \`rankedCatalog()\`, \`event()\` và \`exposure()\`. Các sản phẩm cho danh mục dùng HTTP thuần. [Tài liệu SDK](${l.docs}/sdk).`,
    }),
  },
  {
    names: [
      "pricing",
      "price",
      "prices",
      "cost",
      "how much",
      "plans",
      "subscription",
      "rate card",
      "free tier",
      "trial",
      "gia",
      "bang gia",
      "chi phi",
      "bao nhieu tien",
    ],
    reply: (l) => ({
      en: `One API key covers every product, and you pay for decisions, never for measurement. There is no rate card yet. **Build** is free: the open-source SDK, MCP server and templates. **Fix your catalogue**: the Decision Audit is free; repair and verification are priced per cycle, and Decision Monitor is recurring. **Decide live**: the Decision API, Search, Recommendations, Pages and the Promotion Audit API are priced per decision, agreed after a pilot. [Pricing](${l.pricing}) · [What counts toward usage](${l.pricing}#what-counts). To agree a pilot, [contact the team](${l.contact}).`,
      vi: `Một API key dùng cho mọi sản phẩm, và bạn trả cho quyết định, không bao giờ cho đo lường. Hiện chưa có bảng giá cố định. **Xây dựng** miễn phí: SDK mã nguồn mở, máy chủ MCP và các mẫu. **Sửa danh mục của bạn**: Decision Audit miễn phí; sửa và xác minh tính theo từng chu kỳ, còn Decision Monitor tính định kỳ. **Quyết định trực tiếp**: Decision API, Search, Recommendations, Pages và Promotion Audit API tính theo quyết định, thoả thuận sau chương trình thử nghiệm. [Bảng giá](${l.pricing}) · [Những gì được tính vào mức sử dụng](${l.pricing}#what-counts). Muốn thoả thuận thử nghiệm, hãy [liên hệ đội ngũ](${l.contact}).`,
    }),
  },
  {
    names: [
      "usage",
      "what counts",
      "counted",
      "billed",
      "billing",
      "metered",
      "quota",
      "count toward usage",
      "muc su dung",
      "tinh phi",
    ],
    reply: (l) => ({
      en: `Calls that read a visit or return a decision count toward usage: \`POST /decide\`, \`/search\` and \`/rerank\`, \`/catalog/ranked\`, \`/track\` and \`/session\`, the Promotion Audit API (\`/interventions/*\`), and \`/catalog/audit\` and \`/catalog/verify\`. Measurement never counts: \`/event\`, \`/exposure\`, \`/outcomes\` and \`/suggest\` are free, and so are the open-source SDK and MCP server. The full list is on the [pricing page](${l.pricing}#what-counts).`,
      vi: `Những lệnh đọc lượt truy cập hoặc trả về quyết định được tính vào mức sử dụng: \`POST /decide\`, \`/search\` và \`/rerank\`, \`/catalog/ranked\`, \`/track\` và \`/session\`, Promotion Audit API (\`/interventions/*\`), cùng \`/catalog/audit\` và \`/catalog/verify\`. Đo lường không bao giờ được tính: \`/event\`, \`/exposure\`, \`/outcomes\` và \`/suggest\` miễn phí, SDK mã nguồn mở và máy chủ MCP cũng vậy. Danh sách đầy đủ có trên [trang bảng giá](${l.pricing}#what-counts).`,
    }),
  },
  {
    names: ["mcp", "agent", "agents"],
    reply: (l) => ({
      en: `AI agents and coding assistants can read these docs through our MCP server, so they answer from the current reference rather than memory. [MCP for agents](${l.docs}/mcp).`,
      vi: `Các AI agent và trợ lý lập trình có thể đọc tài liệu này qua máy chủ MCP của chúng tôi, để trả lời từ tài liệu mới nhất thay vì trí nhớ. [MCP cho agent](${l.docs}/mcp).`,
    }),
  },
  // The three broad questions page text answers badly: retrieval put the careers page ahead of
  // the industry pages. `any`: answered whenever the question names them, at any length.
  {
    names: [
      "industries",
      "industry",
      "sectors",
      "sector",
      "verticals",
      "nganh nghe",
      "linh vuc nao",
    ],
    any: true,
    reply: (l) => ({
      en: `Pulse works on any product catalogue, and the site has a page for six sectors: [Ecommerce and retail](${l.site}/industries/ecommerce), [FMCG and consumer goods](${l.site}/industries/fmcg), [Technology and electronics](${l.site}/industries/technology), [Furniture and homewares](${l.site}/industries/furniture), [Cosmetics and personal care](${l.site}/industries/cosmetics) and [B2B and industrial](${l.site}/industries/distribution). Each starts the same way: a Decision Audit on one category.`,
      vi: `Pulse dùng được với mọi danh mục sản phẩm, và trang web có một trang cho sáu lĩnh vực: [Thương mại điện tử và bán lẻ](${l.site}/industries/ecommerce), [Hàng tiêu dùng nhanh](${l.site}/industries/fmcg), [Công nghệ và điện tử](${l.site}/industries/technology), [Nội thất và gia dụng](${l.site}/industries/furniture), [Mỹ phẩm và chăm sóc cá nhân](${l.site}/industries/cosmetics) và [B2B và công nghiệp](${l.site}/industries/distribution). Lĩnh vực nào cũng bắt đầu giống nhau: một Decision Audit trên một ngành hàng.`,
    }),
  },
  {
    names: [
      "resolve labs",
      "founder",
      "founders",
      "founded",
      "who made",
      "who built",
      "who is behind",
      "behind pulse",
      "headquarters",
      "the company",
      "your company",
      "nha sang lap",
      "ai lam ra",
      "cong ty",
    ],
    any: true,
    reply: (l) => ({
      en: `Pulse is made by **Resolve Labs**, founded in March 2026, with headquarters in Singapore and engineering in Ho Chi Minh City. It started with a 216-product test shelf, where ranking the gaps by how much data was missing gave almost the opposite order to ranking them by what shoppers said they needed. [About us](${l.site}/about).`,
      vi: `Pulse do **Resolve Labs** làm ra, thành lập tháng 3 năm 2026, trụ sở chính ở Singapore và đội kỹ thuật ở Thành phố Hồ Chí Minh. Mọi thứ bắt đầu từ một kệ thử nghiệm 216 sản phẩm, nơi xếp hạng khoảng trống theo lượng dữ liệu còn thiếu cho ra thứ tự gần như ngược với xếp theo điều người mua nói họ cần. [Về chúng tôi](${l.site}/about).`,
    }),
  },
  {
    names: [
      "markets",
      "countries",
      "which country",
      "southeast asia",
      "vietnam",
      "viet nam",
      "where is pulse",
      "where are you",
      "where do you work",
      "where does pulse work",
      "available in",
      "o dau",
      "hoat dong o dau",
      "o nuoc nao",
    ],
    any: true,
    reply: (l) => ({
      en: `Pulse works with merchants in Vietnam and across Southeast Asia, starting with one category each. Search reads Vietnamese, Thai, Bahasa and English, and the catalogue products work on any export, wherever you sell. Headquarters are in Singapore, engineering in Ho Chi Minh City. [Talk to the team](${l.contact}).`,
      vi: `Pulse làm việc với người bán ở Việt Nam và khắp Đông Nam Á, mỗi nơi bắt đầu với một ngành hàng. Tìm kiếm hiểu tiếng Việt, Thái, Bahasa và tiếng Anh, còn các sản phẩm cho danh mục dùng được với mọi bản xuất, dù bạn bán ở đâu. Trụ sở chính ở Singapore, đội kỹ thuật ở Thành phố Hồ Chí Minh. [Liên hệ đội ngũ](${l.contact}).`,
    }),
  },
  {
    names: [
      "open source",
      "opensource",
      "github",
      "license",
      "licence",
      "ma nguon mo",
    ],
    reply: (l) => ({
      en: `The browser SDK (\`@thepulseapi/sdk\`) and the MCP server for agents are **MIT licensed**. The query parser, evidence formats and return-reason taxonomy are planned. Finding problems is open; deciding what is worth fixing is the API. [Opensource](${l.site}/opensource) · [For developers](${l.docs}/opensource).`,
      vi: `SDK cho trình duyệt (\`@thepulseapi/sdk\`) và máy chủ MCP cho tác tử AI dùng **giấy phép MIT**. Bộ phân tích câu tìm kiếm, định dạng bằng chứng và bảng phân loại lý do trả hàng đang được dự kiến. Tìm vấn đề là mở; quyết định điều gì đáng sửa là API. [Mã nguồn mở](${l.site}/opensource) · [Cho lập trình viên](${l.docs}/opensource).`,
    }),
  },
];

const ASKING_ABOUT =
  /^(what s|what is|what are|whats|explain|define|meaning of|tell me about|describe|how does|what does|how much|is there|do you have|la gi|nghia la gi|giai thich|cho toi biet ve)\b|\b(la gi|nghia la gi|hoat dong the nao|hoat dong ra sao)$/;

function matchTerm(q: string) {
  // Longest name first, so "decision audit" wins over "audit" and "api key" over "key".
  const all = TERMS.flatMap((t) => t.names.map((n) => ({ n, t }))).sort(
    (a, b) => b.n.length - a.n.length,
  );
  for (const { n, t } of all) {
    const at = q.indexOf(n);
    if (at === -1) continue;
    const before = at === 0 || q[at - 1] === " ";
    const after = at + n.length === q.length || q[at + n.length] === " ";
    if (before && after) return t;
  }
  return null;
}

/**
 * A reply that needs no retrieval, or nothing.
 *
 * `final` (small talk) needs no model, so the panel answers it on the page without starting one.
 * A term definition needs none either, but arrives through the worker like any other question.
 */
export function talk(
  query: string,
  lang: string,
  o: Origins,
): { answer: Answer; final: boolean } | null {
  const l: Lang = lang === "vi" ? "vi" : "en";
  const q = normalise(query);
  if (!q) return null;
  const n = words(q);
  const href = links(o, l);

  for (const s of SMALL_TALK) {
    if (n <= s.maxWords && s.test.test(q)) {
      return {
        answer: { body: s.reply(href)[l], sources: [], kind: "answer" },
        final: true,
      };
    }
  }

  // Only when the question is about the term itself, so "how do I call the audit from Python"
  // still goes to retrieval and gets the Python page rather than a definition.
  const term = matchTerm(q);
  if (term && (n <= 4 || term.any || ASKING_ABOUT.test(q))) {
    return {
      answer: { body: term.reply(href)[l], sources: [], kind: "answer" },
      final: false,
    };
  }
  return null;
}

/** Said when neither layer found anything. Friendlier than a bare refusal, and still honest. */
export function unsure(lang: string, o: Origins): string {
  const l: Lang = lang === "vi" ? "vi" : "en";
  const h = links(o, l);
  return l === "vi"
    ? `Tôi chưa tìm thấy câu trả lời cho câu đó trên trang của chúng tôi. Thử hỏi theo cách khác, ví dụ:\n- Decision Audit là gì?\n- Lấy API key như thế nào?\n- Chi phí bao nhiêu?\n\nHoặc xem [tài liệu](${h.docs}), [bảng giá](${h.pricing}), hay [liên hệ đội ngũ](${h.contact}) để hỏi trực tiếp.`
    : `I couldn't find that on our pages. Try asking another way, for example:\n- What is the Decision Audit?\n- How do I get an API key?\n- What does it cost?\n\nOr browse [the docs](${h.docs}), see [pricing](${h.pricing}), or [contact the team](${h.contact}) to ask a person.`;
}
