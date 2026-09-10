function classifyMessage(text) {
  const lowerText = text.toLowerCase();

  const otpKeywords = [
    'otp', 'verification code', 'one time password', 'one-time password',
    'security code', 'auth code', 'authentication code', 'verify your',
    'do not share', "don't share", 'valid for', 'expires in', 'code is',
    'pin is', 'confirmation code', 'access code', 'login code',
    'ओटीपी', 'सत्यापन कोड', 'गुप्त कोड'
  ];
  const hasOtpKeyword = otpKeywords.some(keyword => lowerText.includes(keyword));
  const hasCode = /\b\d{4,8}\b/.test(text);
  if (hasOtpKeyword && hasCode) {
    return 'otp';
  }

  const transactionKeywords = [
    'debited', 'credited', 'withdrawn', 'balance', 'transferred', 'transaction',
    'a/c', 'acct', 'account no', 'upi', 'neft', 'imps', 'rtgs', 'txn',
    'payment of', 'paid to', 'received from', 'deposit', 'emi', 'wallet',
    'available balance', 'spent at', 'purchase of', 'refund', 'insufficient funds',
    'atm withdrawal', 'auto debit', 'due date', 'bill payment', 'recharge successful',
    'inr', 'rs.', 'rs ', '₹', 'sip purchase', 'folio', 'nav of',
    'डेबिट', 'क्रेडिट', 'बैलेंस', 'निकासी', 'जमा', 'भुगतान', 'खाते से'
  ];
  if (transactionKeywords.some(keyword => lowerText.includes(keyword))) {
    return 'transaction';
  }

  const promoKeywords = [
    'sale', 'offer', 'discount', 'cashback', 'buy now', 'limited time',
    '% off', 'deal', 'coupon', 'promo code', 'flat off', 'shop now',
    'free delivery', 'exclusive offer', 'best price', 'clearance', 'save big',
    'hurry', "don't miss", 'grab now', 'new arrivals', 'flash sale',
    'combo offer', 'lowest price', 'today only', 'special price',
    'win a', 'lucky draw', 'lottery', 'prize', 'congratulations you',
    'unsubscribe', 'click here to', 'limited stock', 'mega sale',
    'bumper offer', 'loot', 'trending now', 'anniversary', 'shop', 'store',
    'new collection', 'season sale', 'super saver', 'ends soon', 'ends tonight',
    'best deal', 'now available', 'starting at', 'starting @', 'flat',
    'feedback', 'rate your recent', 'wishlist', 'sneak peek', 'reviews are in',
    "sorry to see you leave", 'loyalty program', 't&c', 'find your fit',
    'new season', 'rush this weekend', 'exciting rewards', 'share your feedback',
    'help us do better', 'points earning', 'complete your purchase',
    'ऑफर', 'छूट', 'मुफ्त', 'जीतें', 'इनाम', 'सेल', 'डिस्काउंट',
    'इंस्टॉल करें', 'डाउनलोड करें', 'आज ही', 'टैप करें', 'खरीदें',
    'समाधान', 'एक्सपर्ट', 'शुरू करने के लिए'
  ];
  if (promoKeywords.some(keyword => lowerText.includes(keyword))) {
    return 'promotional';
  }

  const serviceKeywords = [
    'order', 'delivery', 'appointment', 'reminder', 'scheduled', 'confirmed',
    'booking', 'shipped', 'out for delivery', 'dispatched', 'tracking id',
    'has been delivered', 'reschedule', 'cancelled', 'due for renewal',
    'subscription', 'plan expires', 'kyc', 'update your', 'verify your account',
    'service request', 'ticket number', 'complaint', 'technician',
    'installation', 'renewal', 'expiring soon', 'bill generated',
    'invoice', 'download the', 'app update', 'maintenance',
    'missed call', 'team jio', 'official and legitimate', 'regulatory authority',
    'contact us', 'call back', 'customer care', 'helpline', 'support team',
    'registered email id', 'electoral roll', 'available to take calls',
    'शिकायत', 'दर्ज करें', 'रिचार्ज', 'नवीनीकरण', 'सूचना', 'ऐप पर',
    'सूचित करें', 'रिश्वत', 'बारिश', 'आंधी-तूफान', 'चेतावनी', 'मौसम',
    'भारी वर्षा', 'बिजली कड़कने', 'तेज़ बारिश', 'कॉल बैक', 'संपर्क'
  ];
  if (serviceKeywords.some(keyword => lowerText.includes(keyword))) {
    return 'service';
  }

  // Agar message mein koi link hai (http/https/www ya bina http ke bhi
  // "domain.com/xyz" jaisa koi bit.ly/ct3.io/tirabeauty.com type link) lekin
  // upar ki kisi category se match nahi hua, toh yeh personal nahi ho sakta -
  // normal log link wale text nahi bhejte. Aise messages ko "promotional"
  // maan lete hain (zyaadatar business/marketing/feedback links hote hain).
  // Email address (jaise "gmail.com" @ ke baad) ko link nahi maante.
  const hasLink = /(https?:\/\/[^\s]+|www\.[^\s]+|(?<!@)\b[a-z0-9][a-z0-9-]*\.(?:com|in|io|co|net|org|me|shop|app|info|link|xyz|ly|gl)\b(?:\/\S*)?)/i.test(text);
  if (hasLink) {
    return 'promotional';
  }

  return 'personal';
}

function detectPhishing(text) {
  const lowerText = text.toLowerCase();

  const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const urls = text.match(urlPattern);

  if (!urls) {
    return false;
  }

  const shorteners = ['bit.ly', 'tinyurl', 'goo.gl', 't.co', 'ow.ly', 'is.gd', 'buff.ly', 'shorturl', 'tiny.jio.com', 'ct3.io'];
  const hasShortener = urls.some(url =>
    shorteners.some(shortener => url.toLowerCase().includes(shortener))
  );

  const ipPattern = /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
  const hasIpLink = urls.some(url => ipPattern.test(url));

  const urgencyKeywords = [
    'verify your account', 'account suspended', 'account will be blocked',
    'click here immediately', 'urgent action required', 'confirm your identity',
    'unusual activity', 'account locked', 'update your details',
    'claim your prize', 'you have won', 'limited time offer',
    'verify now', 'security alert', 'suspicious login', 'enter pan', 'enter your pan'
  ];
  const hasUrgencyKeyword = urgencyKeywords.some(keyword => lowerText.includes(keyword));

  const lookalikePattern = /(amaz[o0]n|payp[a4]l|g[o0]{2}gle|faceb[o0]{2}k|netfl[i1]x|bank)[.\-]/i;
  const hasLookalikeDomain = urls.some(url => lookalikePattern.test(url));

  return hasShortener || hasIpLink || hasLookalikeDomain || (hasUrgencyKeyword && urls.length > 0);
}

module.exports = { classifyMessage, detectPhishing };
