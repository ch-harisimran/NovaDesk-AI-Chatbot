export interface SeedMessage {
  role: "user" | "assistant";
  content: string;
  feedback?: "up" | "down";
  minutesAfterStart?: number; // stagger timestamps within a conversation
}

export interface SeedConversation {
  daysAgo: number;
  hour: number; // 0-23, local seed time
  visitorName: string | null;
  visitorEmail: string | null;
  channel: "web" | "whatsapp" | "telegram";
  status: "active" | "handoff" | "closed";
  sentiment: "positive" | "neutral" | "negative" | null;
  messages: SeedMessage[];
  lead?: { name?: string; email?: string };
}

export const seedConversations: SeedConversation[] = [
  {
    daysAgo: 0, hour: 10, visitorName: "Jenna Marlowe", visitorEmail: "jenna.marlowe@gmail.com",
    channel: "web", status: "closed", sentiment: "positive",
    messages: [
      { role: "user", content: "Hi! Can you tell me the status of my order SLC-10234?" },
      { role: "assistant", content: "Let me check that for you. Order SLC-10234 (Dew Drop Vitamin C Serum, Barrier Repair Moisturizer) was delivered 3 days ago via UPS. Tracking number 1Z999AA10123456784 shows it was left at your front door. Hope it arrived safely!", feedback: "up" },
      { role: "user", content: "Yes it did, thank you! Quick question -- can I use the vitamin C serum every day or should I alternate?" },
      { role: "assistant", content: "Daily use is totally fine for Dew Drop -- most people use it morning and evening from day one. Just apply it before your moisturizer, and keep it out of direct sunlight when you're not using it so it stays potent longer.", feedback: "up" },
    ],
  },
  {
    daysAgo: 0, hour: 14, visitorName: null, visitorEmail: null,
    channel: "web", status: "active", sentiment: "neutral",
    messages: [
      { role: "user", content: "do you ship to canada" },
      { role: "assistant", content: "Yes! We ship to Canada in 5-9 business days, flat rate $14.95 CAD, and free over $75 CAD. Duties and taxes are calculated and collected at checkout so there shouldn't be anything due on delivery." },
      { role: "user", content: "nice, and is the shipping tracked" },
      { role: "assistant", content: "Yep, every Canadian order ships with tracking -- you'll get a tracking link by email as soon as the label is created." },
    ],
  },
  {
    daysAgo: 1, hour: 9, visitorName: "Marcus Webb", visitorEmail: "marcus.webb@yahoo.com",
    channel: "web", status: "closed", sentiment: "neutral",
    messages: [
      { role: "user", content: "where's my order SLC-10236" },
      { role: "assistant", content: "Order SLC-10236 (Dew Drop Vitamin C Serum) is out for delivery today! Tracking number 1Z999AA10123457003. It should arrive by end of day." },
      { role: "user", content: "perfect thanks" },
    ],
  },
  {
    daysAgo: 1, hour: 19, visitorName: "Ashley Tran", visitorEmail: "ashley.tran99@gmail.com",
    channel: "web", status: "handoff", sentiment: "negative",
    messages: [
      { role: "user", content: "This is really frustrating. My order SLC-10237 was supposed to arrive days ago and it's still not here!!" },
      { role: "assistant", content: "I completely understand the frustration, and I'm sorry about the delay. I can see SLC-10237 has been flagged as delayed by the carrier -- it's currently showing a new estimated delivery in about 4 days. I know that's not what you want to hear after already waiting.", feedback: "down" },
      { role: "user", content: "4 more days?? I need this before Friday, can someone actually help me instead of just reading me a tracking status" },
      { role: "assistant", content: "That's completely fair, and I don't want you to just get a canned tracking update -- let me get a member of our support team to look at expediting a replacement or finding another solution for your Friday deadline. Connecting you with a teammate now." },
    ],
  },
  {
    daysAgo: 2, hour: 11, visitorName: "Priya Chandran", visitorEmail: "priya.chandran@outlook.com",
    channel: "web", status: "closed", sentiment: "positive",
    messages: [
      { role: "user", content: "Is the Gentle Clay Cleanser okay for sensitive skin? I have rosacea" },
      { role: "assistant", content: "Gentle Clay Cleanser is formulated to be suitable for sensitive skin -- it's pH-balanced, sulfate-free, and fragrance-free. That said, with rosacea specifically, I'd recommend patch testing first: apply a small amount behind your ear or on your inner forearm once a day for 3 days and watch for any redness or irritation before using it on your face." },
      { role: "user", content: "good idea, will do. also is it fragrance free, i didn't see that on the product page" },
      { role: "assistant", content: "Good catch, and yes -- it is fragrance-free, I'll flag that it should be called out more clearly on the product page. Thanks for pointing that out!", feedback: "up" },
    ],
  },
  {
    daysAgo: 2, hour: 16, visitorName: null, visitorEmail: null,
    channel: "web", status: "active", sentiment: "neutral",
    messages: [
      { role: "user", content: "bonjour, est-ce que vous livrez en france ?" },
      { role: "assistant", content: "Bonjour ! Oui, nous livrons en France en 7 a 12 jours ouvres, avec un tarif fixe de 12,95 EUR (livraison gratuite au-dela de 65 EUR). La TVA et les droits de douane sont deja inclus au moment du paiement, donc vous ne devriez rien avoir a payer a la livraison." },
      { role: "user", content: "super, merci !" },
      { role: "assistant", content: "Avec plaisir ! N'hesitez pas si vous avez d'autres questions." },
    ],
  },
  {
    daysAgo: 3, hour: 13, visitorName: "David Okafor", visitorEmail: "davidokafor@proton.me",
    channel: "web", status: "closed", sentiment: "neutral",
    messages: [
      { role: "user", content: "hey, when will my order SLC-10238 ship? it still says processing" },
      { role: "assistant", content: "SLC-10238 (Barrier Repair Moisturizer) is still in processing right now, with an estimated delivery in about 6 days. Orders placed before 1pm PT ship same-day, so if it was placed after that cutoff it should move to 'shipped' within the next business day." },
      { role: "user", content: "ok that makes sense, thanks" },
    ],
  },
  {
    daysAgo: 3, hour: 20, visitorName: "Rachel Osei", visitorEmail: null,
    channel: "web", status: "active", sentiment: "positive",
    messages: [
      { role: "user", content: "What's the difference between Dew Drop and Silk Peptide serum? trying to decide which to get" },
      { role: "assistant", content: "Great question -- they target different things. Dew Drop is our vitamin C serum: it's about brightening, evening out tone, and antioxidant protection, used daily AM or PM. Silk Peptide is more about firmness and fine lines -- it's typically used 2-3x a week, often alongside Dew Drop rather than instead of it. If tone/dullness is your main concern, start with Dew Drop; if it's more about texture and firmness, Silk Peptide. Totally fine to use both once your skin is used to actives." },
      { role: "user", content: "got it, i'll grab dew drop first. also can i get updates when new products launch? this is rachel by the way, rachel.osei@gmail.com" },
      { role: "assistant", content: "Nice to meet you, Rachel! I've saved your email so our team can reach out about new launches. Thanks for chatting with us today." },
    ],
    lead: { name: "Rachel Osei", email: "rachel.osei@gmail.com" },
  },
  {
    daysAgo: 4, hour: 8, visitorName: "Linda Hsu", visitorEmail: "linda.hsu@icloud.com",
    channel: "web", status: "closed", sentiment: "positive",
    messages: [
      { role: "user", content: "just wanted to say the vitamin c serum is amazing, noticed a difference in like 2 weeks" },
      { role: "assistant", content: "That's so great to hear, thank you for sharing! Consistent daily use really does make a difference with Dew Drop -- glad it's working well for you.", feedback: "up" },
      { role: "user", content: "is there a referral program? i want to tell my sister" },
      { role: "assistant", content: "We don't have a formal referral program running right now, but if she signs up for our newsletter she'll get a 15% welcome code automatically -- that's the best discount available for a first order." },
    ],
  },
  {
    daysAgo: 5, hour: 15, visitorName: null, visitorEmail: null,
    channel: "web", status: "active", sentiment: "neutral",
    messages: [
      { role: "user", content: "do you test on animals" },
      { role: "assistant", content: "No -- every Solace product is cruelty-free, meaning nothing is tested on animals at any stage of development. Most of our line is also vegan, with two exceptions (Honey Enzyme Mask and Silk Peptide Serum) which are clearly labeled on the product page." },
    ],
  },
  {
    daysAgo: 5, hour: 21, visitorName: "Tomas Theron", visitorEmail: "tomastheron@gmail.com",
    channel: "web", status: "handoff", sentiment: "negative",
    messages: [
      { role: "user", content: "I returned the cleanser weeks ago and still don't see my refund. order SLC-10240" },
      { role: "assistant", content: "I'm sorry for the wait on that. I can see SLC-10240 shows as returned in our system, which means we received it back -- refunds normally process within 5-7 business days of that. Since it's been longer than that, something may have gotten stuck on our end. Let me connect you with our support team to get this resolved directly rather than leaving you waiting on a status check.", feedback: "down" },
      { role: "user", content: "please, this is taking way too long" },
      { role: "assistant", content: "Completely understand -- flagging this for a teammate now, they'll follow up by email with your refund confirmation." },
    ],
  },
  {
    daysAgo: 6, hour: 12, visitorName: "Nicole Andrews", visitorEmail: "nicole.b.andrews@gmail.com",
    channel: "web", status: "closed", sentiment: "neutral",
    messages: [
      { role: "user", content: "i need to cancel my order SLC-10241, ordered the wrong item" },
      { role: "assistant", content: "No problem! I can see SLC-10241 (Honey Enzyme Mask) -- since it hasn't shipped yet, I've flagged it for cancellation and you'll get a refund confirmation by email shortly. Sorry for the mix-up, and let me know if you'd like help picking the right product instead." },
      { role: "user", content: "thanks, i actually meant to order the clay cleanser, can you just swap it" },
      { role: "assistant", content: "Once an order's in our cancellation queue I'm not able to modify it directly from here, but as soon as you see the cancellation confirmation, feel free to place a fresh order for Gentle Clay Cleanser -- happy to send you a quick discount code for the mix-up if that helps." },
    ],
  },
  {
    daysAgo: 7, hour: 10, visitorName: "Kevin de la Torre", visitorEmail: "kevin.delatorre@hotmail.com",
    channel: "web", status: "closed", sentiment: "positive",
    messages: [
      { role: "user", content: "got my order today! SLC-10243. everything looks great, thanks for the fast shipping" },
      { role: "assistant", content: "Wonderful, so glad it arrived quickly! Let us know if you have any questions getting started with the cleanser and moisturizer.", feedback: "up" },
    ],
  },
  {
    daysAgo: 7, hour: 17, visitorName: null, visitorEmail: null,
    channel: "web", status: "active", sentiment: "neutral",
    messages: [
      { role: "user", content: "can i pause my subscription for a couple months, going on a trip" },
      { role: "assistant", content: "Yes, you can skip any number of upcoming shipments from your account under 'Manage Subscription' -- just make sure to do it at least 48 hours before your next scheduled charge so it applies to that cycle. You can resume anytime, no fees either way." },
      { role: "user", content: "perfect, thank you" },
    ],
  },
  {
    daysAgo: 8, hour: 9, visitorName: null, visitorEmail: null,
    channel: "whatsapp", status: "closed", sentiment: "neutral",
    messages: [
      { role: "user", content: "hola, tienen envio a mexico?" },
      { role: "assistant", content: "Hola! Por ahora enviamos a Estados Unidos, Canada, Reino Unido y la Union Europea, pero todavia no a Mexico. Nos encantaria expandirnos alli en el futuro -- gracias por tu interes." },
      { role: "user", content: "ok gracias" },
    ],
  },
  {
    daysAgo: 9, hour: 13, visitorName: "Jenna Marlowe", visitorEmail: "jenna.marlowe@gmail.com",
    channel: "web", status: "closed", sentiment: "neutral",
    messages: [
      { role: "user", content: "does the moisturizer work under makeup ok" },
      { role: "assistant", content: "Yes -- Barrier Repair absorbs pretty quickly and isn't greasy once it sets, usually about 60-90 seconds after applying. It layers well under sunscreen and makeup without pilling, as long as you give it that little bit of time to fully absorb first." },
    ],
  },
  {
    daysAgo: 10, hour: 20, visitorName: null, visitorEmail: "ariadne.foss@gmail.com",
    channel: "web", status: "active", sentiment: "neutral",
    messages: [
      { role: "user", content: "i have really oily acne prone skin, will the moisturizer break me out" },
      { role: "assistant", content: "Barrier Repair is formulated to be non-comedogenic and is used by a lot of customers with oily/acne-prone skin -- the ceramides and niacinamide actually help support the skin barrier, which can reduce excess oil production over time. That said, everyone's skin is different, so I'd suggest patch testing first if you're prone to reactions. Want me to save your email in case our team wants to follow up with routine tips for oily skin?" },
      { role: "user", content: "sure, ariadne.foss@gmail.com" },
      { role: "assistant", content: "Got it, thank you Ariadne! We'll follow up with some routine tips for oily/acne-prone skin." },
    ],
    lead: { email: "ariadne.foss@gmail.com" },
  },
  {
    daysAgo: 11, hour: 11, visitorName: null, visitorEmail: null,
    channel: "web", status: "closed", sentiment: "positive",
    messages: [
      { role: "user", content: "is the packaging recyclable" },
      { role: "assistant", content: "Yes -- our bottles and jars are recycled glass or #1/#2 recyclable plastic, cartons are FSC-certified recycled cardboard, and shipping mailers are curbside-recyclable paper rather than plastic. We also run a Refill & Return program: send back 5 empty containers and get a $10 account credit." },
      { role: "user", content: "love that, thanks!" },
    ],
  },
  {
    daysAgo: 13, hour: 14, visitorName: null, visitorEmail: null,
    channel: "telegram", status: "closed", sentiment: "neutral",
    messages: [
      { role: "user", content: "whats the shelf life on the vitamin c serum once opened" },
      { role: "assistant", content: "Once opened, we recommend using Dew Drop within 3-4 months for peak potency -- vitamin C serums oxidize with light and air exposure over time. Keep the cap tightly closed and store it away from direct sunlight to help it last. Unopened, it's good for 12 months." },
    ],
  },
  {
    daysAgo: 14, hour: 16, visitorName: null, visitorEmail: null,
    channel: "web", status: "closed", sentiment: "negative",
    messages: [
      { role: "user", content: "the serum broke me out badly, not happy about this" },
      { role: "assistant", content: "I'm really sorry to hear that -- that's frustrating, especially when you're trying to improve your skin, not upset it. A few things that can help right away: stop use, and apply a plain, fragrance-free moisturizer like Barrier Repair to help calm things down, usually within a day or two. If you'd like, we're also happy to process a full refund or exchange under our 60-day guarantee, no need to send the product back for that.", feedback: "down" },
      { role: "user", content: "ok a refund would be good" },
      { role: "assistant", content: "Understood -- please email returns@solaceskincare.com with your order number and we'll get that refund started right away. Again, really sorry it didn't work out for your skin." },
    ],
  },
];
