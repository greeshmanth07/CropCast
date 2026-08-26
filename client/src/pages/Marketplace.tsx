import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  BarChart3,
  Bell,
  Bot,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock,
  Factory,
  Handshake,
  History,
  IndianRupee,
  MapPin,
  Package,
  PackageCheck,
  Plus,
  RotateCcw,
  Route,
  Scale,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingBasket,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  Star,
  Store,
  TrendingUp,
  Truck,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { COMMODITIES, getCommodityImage, getCommodityAlt } from "@shared/commodities";
import { LocationInput } from "@/components/LocationInput";

type Role = "farmer" | "buyer" | "admin";
type Screen = "dashboard" | "list" | "market" | "requirement" | "confirm" | "track" | "history";
type Farmer = { fullName: string; mobile: string; location: string } | null;

const english = {
  back: "Back to market guide",
  title: "Direct produce. Better choices.",
  subtitle: "Simple buying and selling — from farm to buyer.",
  farmer: "Farmer / FPO",
  buyer: "Buyer",
  admin: "Admin",
  list: "List My Produce",
  find: "Find Produce",
  notifications: "Updates",
  crops: "My Crops",
  todayPrice: "Today’s price",
  demand: "Demand",
  high: "HIGH",
  buyers: "Who wants this?",
  ai: "AI suggestion",
  bestDay: "Best day",
  expected: "Expected",
  bestBuyer: "Best buyer",
  distance: "Distance",
  online: "Sell to buyer",
  offline: "Nearby market",
  listStep: "List your produce",
  chooseCrop: "Choose crop",
  howMuch: "How much?",
  where: "Where?",
  when: "When ready?",
  price: "Price / kg",
  quality: "Quality",
  publish: "Publish produce",
  next: "Next",
  previous: "Back",
  gradeA: "Grade A",
  gradeB: "Grade B",
  gradeC: "Grade C",
  ready: "Ready tomorrow",
  live: "Live for buyers",
  buyerTitle: "Find produce near you",
  buyerSub: "Choose a crop. See simple total cost.",
  searchCrop: "Search crop",
  available: "Available near you",
  selectDeal: "See total cost",
  cropCost: "Crop price",
  delivery: "Delivery",
  total: "Total cost",
  best: "BEST",
  bestReason: "Lower total cost · nearby · enough quantity",
  order: "Place order",
  confirm: "Confirm order",
  cancel: "Cancel",
  need: "I Need Produce",
  postNeed: "Post requirement",
  required: "Required date",
  maxPrice: "Maximum price",
  seller: "Farmer / FPO",
  history: "My purchases",
  buyAgain: "Buy again",
  savings: "My savings",
  saved: "You saved",
  rate: "How was the produce?",
  freshness: "Freshness",
  packaging: "Packaging",
  comment: "Add comment",
  submitRating: "Submit rating",
  tracking: "Track order",
  confirmed: "Confirmed",
  packed: "Packed",
  picked: "Picked up",
  delivered: "Delivered",
  kmAway: "km away",
  logistics: "Smart delivery",
  route: "Pickup → delivery",
  plan: "Plan pickup",
  start: "Start delivery",
  finish: "Mark delivered",
  adminTitle: "CropCast overview",
  supplyDemand: "Supply ↔ Demand",
  supply: "Supply",
  demandLabel: "Demand",
  shortage: "Shortage",
  surplus: "Surplus",
  farmers: "Farmers",
  orders: "Orders",
  deliveries: "Deliveries",
  buyersLabel: "Buyers",
  active: "Active",
  offer: "Make an offer",
  accept: "Accept",
  reject: "Reject",
  counter: "Counter",
  sent: "Offer sent",
  noListings: "No produce yet. Add your first crop.",
  create: "Create",
  requirements: "Buyer needs",
  languageNotice: "English + తెలుగు ready",
  tomato: "Tomato",
  rice: "Rice",
  onion: "Onion",
  potato: "Potato",
  market: "Market",
  profile: "Profile",
  seeMarket: "See market",
  buyerDemo: "Buyer demo",
  farmerDemo: "Farmer demo",
};

const telugu: Partial<typeof english> = {
  back: "మార్కెట్ గైడ్‌కు తిరిగి",
  title: "నేరుగా పంట. మంచి ఎంపికలు.",
  subtitle: "పొలం నుండి కొనుగోలుదారుడి వరకు సులభమైన కొనుగోలు మరియు అమ్మకం.",
  farmer: "రైతు / FPO",
  buyer: "కొనుగోలుదారు",
  admin: "అడ్మిన్",
  list: "నా పంటను జాబితా చేయండి",
  find: "పంటను కనుగొనండి",
  notifications: "అప్డేట్లు",
  crops: "నా పంటలు",
  todayPrice: "ఈరోజు ధర",
  demand: "డిమాండ్",
  high: "ఎక్కువ",
  buyers: "ఎవరు కొనాలనుకుంటున్నారు?",
  ai: "AI సూచన",
  bestDay: "మంచి రోజు",
  expected: "అంచనా",
  bestBuyer: "మంచి కొనుగోలుదారు",
  distance: "దూరం",
  online: "కొనుగోలుదారునికి అమ్మండి",
  offline: "దగ్గరలోని మార్కెట్",
  listStep: "మీ పంటను జాబితా చేయండి",
  chooseCrop: "పంటను ఎంచుకోండి",
  howMuch: "ఎంత?",
  where: "ఎక్కడ?",
  when: "ఎప్పుడు సిద్ధం?",
  price: "కిలో ధర",
  quality: "నాణ్యత",
  publish: "పంటను ప్రచురించండి",
  next: "తదుపరి",
  previous: "వెనుకకు",
  gradeA: "గ్రేడ్ A",
  gradeB: "గ్రేడ్ B",
  gradeC: "గ్రేడ్ C",
  ready: "రేపు సిద్ధం",
  live: "కొనుగోలుదారులకు అందుబాటులో ఉంది",
  buyerTitle: "మీ దగ్గర పంటను కనుగొనండి",
  buyerSub: "పంటను ఎంచుకోండి. మొత్తం ఖర్చు చూడండి.",
  searchCrop: "పంటను వెతకండి",
  available: "మీ దగ్గర అందుబాటులో ఉంది",
  selectDeal: "మొత్తం ఖర్చు చూడండి",
  cropCost: "పంట ధర",
  delivery: "డెలివరీ",
  total: "మొత్తం ఖర్చు",
  best: "అత్యుత్తమం",
  bestReason: "తక్కువ మొత్తం ఖర్చు · దగ్గరలో · సరిపడా పరిమాణం",
  order: "ఆర్డర్ చేయండి",
  confirm: "ఆర్డర్ నిర్ధారించండి",
  cancel: "రద్దు",
  need: "నాకు పంట కావాలి",
  postNeed: "అవసరాన్ని ప్రచురించండి",
  required: "అవసరమైన తేదీ",
  maxPrice: "గరిష్ట ధర",
  seller: "రైతు / FPO",
  history: "నా కొనుగోళ్లు",
  buyAgain: "మళ్ళీ కొనండి",
  savings: "నా పొదుపు",
  saved: "మీరు ఆదా చేసారు",
  rate: "పంట ఎలా ఉంది?",
  freshness: "తాజాదనం",
  packaging: "ప్యాకింగ్",
  comment: "వ్యాఖ్య జోడించండి",
  submitRating: "రేటింగ్ ఇవ్వండి",
  tracking: "ఆర్డర్ ట్రాక్ చేయండి",
  confirmed: "నిర్ధారించబడింది",
  packed: "ప్యాక్ చేయబడింది",
  picked: "తీసుకెళ్లారు",
  delivered: "డెలివరీ అయింది",
  kmAway: "కిమీ దూరంలో",
  logistics: "స్మార్ట్ డెలివరీ",
  route: "తీసుకునే స్థలం → డెలివరీ",
  plan: "తీసుకోవడం ప్లాన్ చేయండి",
  start: "డెలివరీ ప్రారంభించండి",
  finish: "డెలివరీ పూర్తయింది",
  adminTitle: "AgriMarket అవలోకనం",
  supplyDemand: "సరఫరా ↔ డిమాండ్",
  supply: "సరఫరా",
  demandLabel: "డిమాండ్",
  shortage: "కొరత",
  surplus: "మిగులు",
  farmers: "రైతులు",
  orders: "ఆర్డర్లు",
  deliveries: "డెలివరీలు",
  buyersLabel: "కొనుగోలుదారులు",
  active: "యాక్టివ్",
  offer: "ఆఫర్ ఇవ్వండి",
  accept: "అంగీకరించండి",
  reject: "తిరస్కరించండి",
  counter: "కౌంటర్",
  sent: "ఆఫర్ పంపబడింది",
  noListings: "ఇంకా పంట లేదు. మీ మొదటి పంటను జోడించండి.",
  create: "సృష్టించండి",
  requirements: "కొనుగోలుదారుల అవసరాలు",
  languageNotice: "English + తెలుగు సిద్ధంగా ఉంది",
  tomato: "టమాటా",
  rice: "వరి",
  onion: "ఉల్లిపాయ",
  potato: "బంగాళాదుంప",
  market: "మార్కెట్",
  profile: "ప్రొఫైల్",
  seeMarket: "మార్కెట్ చూడండి",
  buyerDemo: "కొనుగోలుదారు డెమో",
  farmerDemo: "రైతు డెమో",
};

const marketplaceText = {
  English: {
    platform: "Intelligent demand-supply platform",
    loading: "Loading…",
    kg: "kg",
    today: "Today",
    tomorrow: "Tomorrow",
    inTwoDays: "In 2 days",
    loginRequired: "Login as a farmer to publish produce.",
    listingRequired: "Add quantity, location and price.",
    listingFailed: "Could not publish produce.",
    requirementRequired: "Add quantity, location and price.",
    requirementFailed: "Could not post requirement.",
    deliveryFailed: "Could not update delivery.",
    myLocation: "Use my location",
    locationSelected: "Tenali selected",
    optionalPhoto: "Optional crop photo",
    optionalPhotoHelp: "Add an image if it helps buyers recognize the produce.",
    photoSelected: "selected",
    orderStatus: {
      confirmed: "Confirmed",
      pickup_planned: "Pickup planned",
      in_transit: "In transit",
      delivered: "Delivered",
    },
  },
  తెలుగు: {
    platform: "తెలివైన డిమాండ్-సరఫరా వేదిక",
    loading: "లోడ్ అవుతోంది…",
    kg: "కిలోలు",
    today: "ఈరోజు",
    tomorrow: "రేపు",
    inTwoDays: "2 రోజుల్లో",
    loginRequired: "పంట ప్రచురించడానికి రైతుగా లాగిన్ అవ్వండి.",
    listingRequired: "పరిమాణం, ప్రదేశం మరియు ధర జోడించండి.",
    listingFailed: "పంటను ప్రచురించలేకపోయాము.",
    requirementRequired: "పరిమాణం, ప్రదేశం మరియు ధర జోడించండి.",
    requirementFailed: "అవసరాన్ని ప్రచురించలేకపోయాము.",
    deliveryFailed: "డెలివరీని నవీకరించలేకపోయాము.",
    myLocation: "నా ప్రదేశాన్ని ఉపయోగించండి",
    locationSelected: "తెనాలి ఎంచుకున్నారు",
    optionalPhoto: "ఐచ్ఛిక పంట ఫోటో",
    optionalPhotoHelp: "కొనుగోలుదారులు పంటను గుర్తించడానికి ఉపయోగపడితే చిత్రం జోడించండి.",
    photoSelected: "ఎంచుకున్నారు",
    orderStatus: {
      confirmed: "నిర్ధారించబడింది",
      pickup_planned: "పికప్ ప్లాన్",
      in_transit: "రవాణాలో ఉంది",
      delivered: "డెలివరీ అయింది",
    },
  },
} as const;

const cropImages: Record<string, string> = {
  Tomato: "/images/crops/tomato.jpg",
  Rice: "/images/crops/rice.jpg",
  Onion: "/images/crops/onion.jpg",
  Potato: "/images/crops/potato.jpg",
  Maize: "/images/crops/maize.jpg",
  Chilli: "/images/crops/chilli.jpg",
  Cotton: "/images/crops/cotton.jpg",
  Turmeric: "/images/crops/turmeric.jpg",
  tomato: "/images/crops/tomato.jpg",
  rice: "/images/crops/rice.jpg",
  onion: "/images/crops/onion.jpg",
  potato: "/images/crops/potato.jpg",
  maize: "/images/crops/maize.jpg",
  chilli: "/images/crops/chilli.jpg",
  cotton: "/images/crops/cotton.jpg",
  turmeric: "/images/crops/turmeric.jpg",
};
const money = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

function RouteVisual({ location = "Tenali", destination = "Vijayawada" }: { location?: string; destination?: string }) {
  return (
    <div className="simple-route-map">
      <span className="route-pin route-a">
        <MapPin size={13} /> {location}
      </span>
      <span className="route-pin route-b">
        <Store size={13} /> {destination}
      </span>
      <svg viewBox="0 0 600 270" preserveAspectRatio="none" aria-hidden="true">
        <path d="M65 202 C170 168 240 66 340 124 S445 175 545 62" />
        <circle cx="65" cy="202" r="8" />
        <circle cx="340" cy="124" r="8" />
        <circle cx="545" cy="62" r="8" />
      </svg>
      <span className="route-van">
        <Truck size={24} color="#1F6B45" />
      </span>
    </div>
  );
}

export default function Marketplace({
  farmer,
  onBack,
  onLanguage,
  language = "English",
  initialRole = "farmer",
  directDashboard = false,
}: {
  farmer: Farmer;
  onBack: () => void;
  onLanguage?: (next: "English" | "తెలుగు") => void;
  language?: string;
  initialRole?: Role;
  directDashboard?: boolean;
}) {
  const tr = { ...(language === "తెలుగు" ? { ...english, ...telugu } : english), ...marketplaceText[language === "తెలుగు" ? "తెలుగు" : "English"] };
  const ui =
    language === "తెలుగు"
      ? {
          platform: "తెలివైన డిమాండ్-సరఫరా వేదిక",
          loading: "లోడ్ అవుతోంది…",
          optionalPhoto: "ఐచ్ఛిక పంట ఫోటో",
          optionalPhotoHelp: "కొనుగోలుదారులు పంటను గుర్తించడానికి ఉపయోగపడితే చిత్రం జోడించండి.",
          photoSelected: "ఎంచుకున్నారు",
        }
      : {
          platform: "Intelligent demand-supply platform",
          loading: "Loading…",
          optionalPhoto: "Optional crop photo",
          optionalPhotoHelp: "Add an image if it helps buyers recognize the produce.",
          photoSelected: "selected",
        };
  const utils = trpc.useUtils();
  const snapshot = trpc.marketplace.snapshot.useQuery(undefined, { refetchOnWindowFocus: false });
  const seed = trpc.marketplace.seedTomatoDemo.useMutation();
  const createListing = trpc.marketplace.createListing.useMutation();
  const createRequirement = trpc.marketplace.createRequirement.useMutation();
  const placeOrder = trpc.marketplace.placeOrder.useMutation();
  const updateOrder = trpc.marketplace.updateOrderStatus.useMutation();
  const [role, setRole] = useState<Role>(initialRole);
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [listStep, setListStep] = useState(1);
  const [search, setSearch] = useState("Tomato");
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [qty, setQty] = useState(500);
  const [rating, setRating] = useState(0);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [offer, setOffer] = useState({ quantity: 500, price: 30 });
  const [listingForm, setListingForm] = useState({
    crop: "Tomato",
    quantityKg: "1000",
    quality: "A Grade",
    location: farmer?.location || "Tenali",
    harvestDate: "Tomorrow",
    pricePerKg: "30",
  });
  const [needForm, setNeedForm] = useState({
    buyerName: "Sri Krishna Supermarket",
    buyerType: "Retailer",
    crop: "Tomato",
    quantityKg: "500",
    quality: "A Grade",
    location: "Vijayawada",
    requiredDate: "Tomorrow",
    maxPricePerKg: "33",
  });

  const refresh = () => utils.marketplace.snapshot.invalidate();
  useEffect(() => {
    setRole(initialRole);
  }, [initialRole]);
  const hasAvailableTomatoDemo = Boolean(snapshot.data?.listings.some((item: any) => item.crop.toLowerCase() === "tomato" && item.availableKg >= 1000));
  useEffect(() => {
    if (snapshot.data && !hasAvailableTomatoDemo && !seed.isPending) seed.mutate(undefined, { onSuccess: refresh });
  }, [snapshot.data, hasAvailableTomatoDemo, seed.isPending]);

  const listings = snapshot.data?.listings ?? [];
  const requirements = snapshot.data?.requirements ?? [];
  const uniqueRequirements = requirements.filter(
    (item: any, index: number) =>
      requirements.findIndex((candidate: any) => `${candidate.buyerName}-${candidate.crop}` === `${item.buyerName}-${item.crop}`) === index
  );
  const orders = snapshot.data?.orders ?? [];
  const visibleListings = listings.filter((item: any) => item.crop.toLowerCase().includes(search.toLowerCase()) && item.status !== "sold");
  const tomato = listings.find((item: any) => item.crop.toLowerCase() === "tomato") ?? listings[0];
  const deliveryCost = selectedListing ? Math.max(2, Math.ceil((selectedListing.location.toLowerCase().includes("tenali") ? 28 : 36) / 10)) : 3;
  const totalPerKg = selectedListing ? selectedListing.pricePerKg + deliveryCost : 0;
  const totalCost = totalPerKg * qty;
  const supply = listings.reduce((sum: number, item: any) => sum + item.availableKg, 0);
  const demand = requirements.reduce((sum: number, item: any) => sum + item.quantityKg, 0);
  const activeOrder = selectedOrder ?? orders[0];

  const go = (next: Screen) => {
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const selectRole = (next: Role) => {
    setRole(next);
    localStorage.setItem("agrimarket-active-role", next);
    window.location.hash = next === "farmer" ? "marketplace-farmer" : next === "buyer" ? "marketplace-buy" : "marketplace-admin";
    setScreen("dashboard");
    setSelectedListing(null);
  };
  const publish = () => {
    const quantityKg = Number(listingForm.quantityKg);
    const pricePerKg = Number(listingForm.pricePerKg);
    if (!farmer) return toast.error(tr.loginRequired);
    if (!quantityKg || !pricePerKg || !listingForm.location) return toast.error(tr.listingRequired);
    createListing.mutate(
      {
        farmerMobile: farmer.mobile,
        sellerName: farmer.fullName,
        crop: listingForm.crop,
        quantityKg,
        quality: listingForm.quality,
        location: listingForm.location,
        harvestDate: listingForm.harvestDate,
        pricePerKg,
      },
      {
        onSuccess: () => {
          refresh();
          setListStep(1);
          go("dashboard");
          toast.success(tr.live);
        },
        onError: () => toast.error(tr.listingFailed),
      }
    );
  };
  const postNeed = () => {
    const quantityKg = Number(needForm.quantityKg);
    const maxPricePerKg = Number(needForm.maxPricePerKg);
    if (!quantityKg || !maxPricePerKg || !needForm.location) return toast.error(tr.requirementRequired);
    createRequirement.mutate(
      { ...needForm, quantityKg, maxPricePerKg },
      {
        onSuccess: () => {
          refresh();
          go("market");
          toast.success(tr.requirements);
        },
        onError: () => toast.error(tr.requirementFailed),
      }
    );
  };
  const confirmOrder = () => {
    if (!selectedListing) return;
    placeOrder.mutate(
      { listingId: selectedListing.id, buyerName: needForm.buyerName, quantityKg: Math.min(qty, selectedListing.availableKg) },
      {
        onSuccess: (result) => {
          setSelectedOrder(result.order);
          refresh();
          go("track");
          toast.success(tr.confirmed);
        },
        onError: (error) => toast.error(error.message),
      }
    );
  };
  const updateTrack = (status: "pickup_planned" | "in_transit" | "delivered") => {
    if (!activeOrder) return toast.message(tr.confirmed);
    updateOrder.mutate(
      { orderId: activeOrder.id, status },
      {
        onSuccess: () => {
          refresh();
          toast.success(tr.orderStatus[status]);
        },
        onError: () => toast.error(tr.deliveryFailed),
      }
    );
  };
  const makeOffer = () => {
    if (!selectedListing) return;
    toast.success(`${tr.sent}: ${offer.quantity} kg · ${money(offer.price)}/kg`);
  };

  const cropLabel = (crop: string) => tr[crop.toLowerCase() as keyof typeof english] || crop;
  const roleIcon =
    role === "farmer" ? (
      <span style={{ fontSize: 20 }}>👨‍🌾</span>
    ) : role === "buyer" ? (
      <span style={{ fontSize: 20 }}>🧺</span>
    ) : (
      <span style={{ fontSize: 20 }}>⚙️</span>
    );

  return (
    <main className="farmer-marketplace">
      <header className="market-simple-header">
        <button onClick={onBack}>
          <ArrowLeft size={18} /> {tr.back}
        </button>
        <div>
          <Sprout size={17} /> CropCast{" "}
          <button className="market-language-toggle" onClick={() => onLanguage?.(language === "తెలుగు" ? "English" : "తెలుగు")}>
            {tr.languageNotice}
          </button>
        </div>
        <div className="relative inline-block">
          <button className="notice-button" onClick={() => setNoticeOpen(!noticeOpen)} aria-label={tr.notifications}>
            <Bell size={19} />
            <i>{Math.min(9, requirements.length + orders.length)}</i>
          </button>
          {noticeOpen && (
            <div className="notice-popover" role="dialog" aria-label="Notifications">
              <div className="notice-popover-header">
                <b>{tr.notifications}</b>
                <button
                  type="button"
                  className="notice-close-btn"
                  onClick={() => setNoticeOpen(false)}
                  aria-label="Close notifications"
                  title="Close"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="notice-popover-body">
                <span>
                  <Handshake size={14} color="#1f6b45" /> {requirements.length} {tr.requirements} active
                </span>
                <span>
                  <Truck size={14} color="#1f6b45" /> {orders.length} {tr.orders} scheduled
                </span>
                <span>
                  <Sparkles size={14} color="#e67e22" /> High market demand in Guntur
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {!directDashboard && (
        <section className="market-landing">
          <div>
            <span className="market-kicker">
              <Sprout size={14} /> {ui.platform}
            </span>
            <h1>{tr.title}</h1>
            <p>{tr.subtitle}</p>
            <div className="market-hero-actions">
              <button
                className="market-primary"
                onClick={() => {
                  selectRole("farmer");
                  go("list");
                }}
              >
                <Plus size={18} /> {tr.list}
              </button>
              <button
                className="market-secondary"
                onClick={() => {
                  selectRole("buyer");
                  go("market");
                }}
              >
                <Search size={18} /> {tr.find}
              </button>
            </div>
          </div>
          <div className="market-visual-flow">
            <span>
              <Sprout size={22} />
            </span>
            <i>→</i>
            <span>
              <PackageCheck size={22} />
            </span>
            <i>→</i>
            <span>
              <ShoppingBasket size={22} />
            </span>
            <i>→</i>
            <span>
              <Truck size={22} />
            </span>
          </div>
        </section>
      )}

      <section className="market-shell">
        {!directDashboard && (
          <div className="role-cards" role="tablist">
            <button className={role === "farmer" ? "active" : ""} onClick={() => selectRole("farmer")}>
              <span style={{ fontSize: 24 }}>👨‍🌾</span>
              <b>{tr.farmer}</b>
              <small>{tr.crops}</small>
            </button>
            <button className={role === "buyer" ? "active" : ""} onClick={() => selectRole("buyer")}>
              <span style={{ fontSize: 24 }}>🧺</span>
              <b>{tr.buyer}</b>
              <small>{tr.find}</small>
            </button>
            <button className={role === "admin" ? "active" : ""} onClick={() => selectRole("admin")}>
              <span style={{ fontSize: 24 }}>⚙️</span>
              <b>{tr.admin}</b>
              <small>{tr.active}</small>
            </button>
          </div>
        )}
        <div className="role-context">
          {roleIcon}
          <b>{role === "farmer" ? tr.farmer : role === "buyer" ? tr.buyer : tr.admin}</b>
          <span>• {screen === "dashboard" ? tr.active : screen === "list" ? tr.list : screen === "market" ? tr.available : screen === "track" ? tr.tracking : tr.create}</span>
        </div>

        {snapshot.isLoading && <div className="market-empty">{ui.loading}</div>}

        {snapshot.data && role === "farmer" && screen === "dashboard" && (
          <>
            <section className="farmer-answer-grid">
              <article className="answer-card crop-answer">
                <img src={cropImages.Tomato} alt="Tomato" />
                <div>
                  <span>{tr.crops}</span>
                  <strong>
                    {cropLabel(tomato?.crop ?? "Tomato")} — {tomato?.availableKg?.toLocaleString() ?? "1,000"} kg
                  </strong>
                  <button
                    onClick={() => {
                      setListingForm((f) => ({ ...f, crop: "Tomato" }));
                      go("list");
                    }}
                  >
                    {tr.list} <ChevronRight size={16} />
                  </button>
                </div>
              </article>
              <article className="answer-card money-answer">
                <CircleDollarSign size={23} />
                <span>{tr.todayPrice}</span>
                <strong>₹{tomato?.pricePerKg ?? 30}/kg</strong>
                <em style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <TrendingUp size={13} /> +18% {tr.demand}
                </em>
              </article>
              <article className="answer-card buyer-answer">
                <Handshake size={23} />
                <span>{tr.buyers}</span>
                <strong>
                  {uniqueRequirements.length || 3} {tr.buyer}
                </strong>
                <button onClick={() => go("market")}>
                  {tr.seeMarket} <ChevronRight size={16} />
                </button>
              </article>
            </section>

            <section className="farmer-crop-focus">
              <img src={cropImages.Tomato} alt="Tomato" />
              <div>
                <span className="market-kicker">
                  <Sprout size={13} /> {tr.tomato}
                </span>
                <h2>
                  {tr.todayPrice}: ₹{tomato?.pricePerKg ?? 30}/kg
                </h2>
                <div className="visual-stat-row">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <BarChart3 size={13} /> {tr.demand}: <b>{tr.high}</b>
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <TrendingUp size={13} /> +18%
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <MapPin size={13} /> Vijayawada ₹32/kg
                  </span>
                </div>
              </div>
              <svg viewBox="0 0 330 100" aria-label="Simple price graph">
                <path d="M0 83 L50 71 L104 75 L163 48 L225 40 L276 21 L330 30" />
                <circle cx="276" cy="21" r="5" />
              </svg>
            </section>

            <section className="ai-choice-card">
              <div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={14} /> {tr.ai}
                </span>
                <h2>
                  {tr.bestDay}: Friday · {tr.expected}: ₹32/kg
                </h2>
                <p>
                  {tr.bestBuyer}: Sri Krishna Supermarket · 35 km
                </p>
              </div>
              <div className="sell-choice">
                <button onClick={() => go("market")}>
                  <span>{tr.online}</span>
                  <small>₹32/kg</small>
                </button>
                <button onClick={() => toast.message(`Vijayawada ${tr.market}: ₹31–33/kg`)}>
                  <span>{tr.offline}</span>
                  <small>Vijayawada ₹31–33/kg</small>
                </button>
              </div>
            </section>

            <section className="buyer-nearby">
              <div className="section-title">
                <div>
                  <span className="market-kicker">
                    <Handshake size={13} /> {tr.buyers}
                  </span>
                  <h2>{tr.requirements}</h2>
                </div>
                <button onClick={() => go("market")}>
                  {tr.seeMarket} <ChevronRight size={16} />
                </button>
              </div>
              {uniqueRequirements.slice(0, 3).map((item: any) => (
                <article key={item.id}>
                  <span>
                    <Store size={20} />
                  </span>
                  <div>
                    <b>{item.buyerName}</b>
                    <small>
                      {item.quantityKg} kg · {money(item.maxPricePerKg)}/kg · {item.location}
                    </small>
                  </div>
                  <div className="offer-actions">
                    <button onClick={() => toast.success(`${tr.accept}: ${item.buyerName}`)} title={tr.accept}>
                      <Check size={14} />
                    </button>
                    <button onClick={() => toast.message(`${tr.counter}: ₹${item.maxPricePerKg + 1}/kg`)} title={tr.counter}>
                      <RotateCcw size={14} />
                    </button>
                    <button onClick={() => toast.message(`${tr.reject}`)} title={tr.reject}>
                      <X size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </section>
          </>
        )}

        {snapshot.data && role === "farmer" && screen === "market" && (
          <section className="farmer-buyer-hub">
            <div className="section-title">
              <div>
                <span className="market-kicker">
                  <Handshake size={13} /> {tr.buyers}
                </span>
                <h2>
                  {tr.online} · {tr.offline}
                </h2>
              </div>
              <button onClick={() => go("dashboard")}>
                <ArrowLeft size={16} /> {tr.previous}
              </button>
            </div>
            <div className="seller-card-grid">
              {uniqueRequirements.length ? (
                uniqueRequirements.map((item: any) => (
                  <article className="seller-visual-card" key={item.id}>
                    <img src={cropImages[item.crop] ?? getCommodityImage(item.crop)} alt={getCommodityAlt(item.crop)} />
                    <div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <Store size={13} /> {item.buyerType}
                      </span>
                      <h3>{item.buyerName}</h3>
                      <p>
                        {item.quantityKg} kg · {money(item.maxPricePerKg)}/kg
                      </p>
                      <p>
                        {item.location} · {item.requiredDate}
                      </p>
                    </div>
                    <button onClick={() => toast.success(`${tr.accept}: ${item.buyerName}`)}>
                      <Check size={14} /> {tr.accept}
                    </button>
                  </article>
                ))
              ) : (
                <div className="market-empty">{tr.noListings}</div>
              )}
            </div>
            <section className="offline-market-strip">
              <span>
                <Store size={22} />
              </span>
              <div>
                <b>{tr.offline}</b>
                <small>Vijayawada: ₹31–33/kg · Tenali: ₹29–31/kg</small>
              </div>
              <button onClick={() => toast.message("Vijayawada market selected")}>{tr.seeMarket}</button>
            </section>
          </section>
        )}

        {snapshot.data && role === "farmer" && screen === "list" && (
          <section className="simple-wizard">
            <button className="market-back" onClick={() => go("dashboard")}>
              <ArrowLeft size={17} /> {tr.previous}
            </button>
            <div className="wizard-progress">
              <span className={listStep >= 1 ? "done" : ""}>1</span>
              <span className={listStep >= 2 ? "done" : ""}>2</span>
              <span className={listStep >= 3 ? "done" : ""}>3</span>
              <span className={listStep >= 4 ? "done" : ""}>4</span>
              <span className={listStep >= 5 ? "done" : ""}>5</span>
              <span className={listStep >= 6 ? "done" : ""}>6</span>
            </div>
            <div className="wizard-card">
              {listStep === 1 && (
                <>
                  <span className="wizard-step-icon">
                    <Sprout size={36} color="#1F6B45" />
                  </span>
                  <h2>{tr.chooseCrop}</h2>
                  <div className="wizard-crops">
                    {["Tomato", "Rice", "Onion", "Potato", "Chilli", "Maize", "Cotton", "Turmeric"].map((crop) => (
                      <button
                        className={listingForm.crop === crop ? "selected" : ""}
                        key={crop}
                        onClick={() => setListingForm({ ...listingForm, crop })}
                      >
                        <img src={cropImages[crop] ?? getCommodityImage(crop)} alt={getCommodityAlt(crop)} />
                        {cropLabel(crop)}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {listStep === 2 && (
                <>
                  <span className="wizard-step-icon">
                    <Package size={36} color="#1F6B45" />
                  </span>
                  <h2>{tr.howMuch}</h2>
                  <input
                    className="big-input"
                    inputMode="numeric"
                    value={listingForm.quantityKg}
                    onChange={(event) => setListingForm({ ...listingForm, quantityKg: event.target.value })}
                  />
                  <b>kg</b>
                </>
              )}
              {listStep === 3 && (
                <>
                  <span className="wizard-step-icon">
                    <MapPin size={36} color="#1F6B45" />
                  </span>
                  <h2>{tr.where}</h2>
                  <div style={{ width: "100%", maxWidth: 360, margin: "8px 0" }}>
                    <LocationInput
                      value={listingForm.location}
                      placeholder="Search South Indian district/city..."
                      onChange={(loc) => setListingForm({ ...listingForm, location: loc })}
                    />
                  </div>
                  {farmer?.location && (
                    <button
                      className="location-help"
                      onClick={() => {
                        setListingForm({ ...listingForm, location: farmer.location });
                        toast.message(`${farmer.location} selected`);
                      }}
                    >
                      <MapPin size={14} /> Use my profile location ({farmer.location})
                    </button>
                  )}
                </>
              )}
              {listStep === 4 && (
                <>
                  <span className="wizard-step-icon">
                    <Calendar size={36} color="#1F6B45" />
                  </span>
                  <h2>{tr.when}</h2>
                  <div className="choice-row">
                    {["Today", "Tomorrow", "In 2 days"].map((day) => (
                      <button
                        className={listingForm.harvestDate === day ? "selected" : ""}
                        onClick={() => setListingForm({ ...listingForm, harvestDate: day })}
                        key={day}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {listStep === 5 && (
                <>
                  <span className="wizard-step-icon">
                    <IndianRupee size={36} color="#1F6B45" />
                  </span>
                  <h2>{tr.price}</h2>
                  <input
                    className="big-input"
                    inputMode="numeric"
                    value={listingForm.pricePerKg}
                    onChange={(event) => setListingForm({ ...listingForm, pricePerKg: event.target.value })}
                  />
                  <b>₹ / kg</b>
                </>
              )}
              {listStep === 6 && (
                <>
                  <span className="wizard-step-icon">
                    <Award size={36} color="#1F6B45" />
                  </span>
                  <h2>{tr.quality}</h2>
                  <div className="choice-row">
                    <button
                      className={listingForm.quality === "A Grade" ? "selected" : ""}
                      onClick={() => setListingForm({ ...listingForm, quality: "A Grade" })}
                    >
                      <Award size={15} /> {tr.gradeA}
                    </button>
                    <button
                      className={listingForm.quality === "B Grade" ? "selected" : ""}
                      onClick={() => setListingForm({ ...listingForm, quality: "B Grade" })}
                    >
                      <Award size={15} /> {tr.gradeB}
                    </button>
                    <button
                      className={listingForm.quality === "C Grade" ? "selected" : ""}
                      onClick={() => setListingForm({ ...listingForm, quality: "C Grade" })}
                    >
                      <Award size={15} /> {tr.gradeC}
                    </button>
                  </div>
                </>
              )}
              <div className="wizard-actions">
                {listStep > 1 && <button onClick={() => setListStep(listStep - 1)}>{tr.previous}</button>}
                {listStep < 6 ? (
                  <button className="market-primary" onClick={() => setListStep(listStep + 1)}>
                    {tr.next} <ChevronRight size={17} />
                  </button>
                ) : (
                  <button className="market-primary" onClick={publish} disabled={createListing.isPending}>
                    <PackageCheck size={17} /> {tr.publish}
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {snapshot.data && role === "farmer" && screen === "list" && listStep === 3 && (
          <label className="optional-photo">
            <Camera size={16} /> {ui.optionalPhoto}
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) toast.success(`${file.name} ${ui.photoSelected}`);
              }}
            />
            <small>{ui.optionalPhotoHelp}</small>
          </label>
        )}

        {snapshot.data && role === "buyer" && screen === "dashboard" && (
          <>
            <section className="buyer-hero-card">
              <div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <ShoppingBasket size={15} /> {tr.buyer}
                </span>
                <h2>{tr.buyerTitle}</h2>
                <p>{tr.buyerSub}</p>
              </div>
              <div>
                <button className="market-primary" onClick={() => go("market")}>
                  <Search size={17} /> {tr.find}
                </button>
                <button className="market-secondary" onClick={() => go("requirement")}>
                  <Plus size={17} /> {tr.need}
                </button>
              </div>
            </section>
            <section className="buyer-summary-grid">
              <article>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <IndianRupee size={14} /> {tr.savings}
                </span>
                <strong>₹8,400</strong>
                <small>{tr.saved}</small>
              </article>
              <article>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <History size={14} /> {tr.history}
                </span>
                <strong>{orders.length}</strong>
                <button onClick={() => go("history")}>
                  {tr.history} <ChevronRight size={15} />
                </button>
              </article>
              <article>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Truck size={14} /> {tr.tracking}
                </span>
                <strong>{orders.filter((item: any) => item.status !== "delivered").length}</strong>
                <button onClick={() => go("track")}>
                  {tr.tracking} <ChevronRight size={15} />
                </button>
              </article>
            </section>
          </>
        )}

        {snapshot.data && role === "buyer" && screen === "market" && (
          <section className="buyer-market">
            <div className="section-title">
              <div>
                <span className="market-kicker">
                  <ShoppingBasket size={13} /> {tr.available}
                </span>
                <h2>{tr.find}</h2>
              </div>
              <button onClick={() => go("requirement")}>
                <Plus size={16} /> {tr.need}
              </button>
            </div>
            <div className="buyer-search">
              <Search size={19} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={tr.searchCrop} />
              <button onClick={() => setSearch("")}>×</button>
            </div>
            <div className="seller-card-grid">
              {visibleListings.length ? (
                visibleListings.map((item: any) => (
                  <article className={selectedListing?.id === item.id ? "seller-visual-card selected" : "seller-visual-card"} key={item.id}>
                    <img src={cropImages[item.crop] ?? cropImages.Tomato} alt="" />
                    <div>
                      <span>{cropLabel(item.crop)}</span>
                      <h3>{item.sellerName}</h3>
                      <p>
                        {item.availableKg} kg · {money(item.pricePerKg)}/kg
                      </p>
                      <p>
                        {item.location} · {item.harvestDate}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedListing(item);
                        setQty(Math.min(500, item.availableKg));
                      }}
                    >
                      {tr.selectDeal} <ChevronRight size={16} />
                    </button>
                  </article>
                ))
              ) : (
                <div className="market-empty">{tr.noListings}</div>
              )}
            </div>
            {selectedListing && (
              <section className="deal-sheet">
                <div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Sparkles size={14} /> {tr.best}
                  </span>
                  <h2>
                    {cropLabel(selectedListing.crop)} · {selectedListing.sellerName}
                  </h2>
                  <div className="deal-calc">
                    <span>
                      {tr.cropCost}
                      <b>{money(selectedListing.pricePerKg)}/kg</b>
                    </span>
                    <span>
                      {tr.delivery}
                      <b>{money(deliveryCost)}/kg</b>
                    </span>
                    <span>
                      {tr.total}
                      <b>{money(totalPerKg)}/kg</b>
                    </span>
                  </div>
                  <p style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Check size={14} /> {tr.bestReason}
                  </p>
                </div>
                <div>
                  <label>
                    {tr.howMuch}
                    <input
                      type="number"
                      min="1"
                      max={selectedListing.availableKg}
                      value={qty}
                      onChange={(event) => setQty(Math.max(1, Number(event.target.value)))}
                    />
                  </label>
                  <strong>{money(totalCost)}</strong>
                  <button className="market-primary" onClick={() => go("confirm")}>
                    {tr.order} <ShoppingBasket size={17} />
                  </button>
                  <button className="offer-button" onClick={makeOffer}>
                    {tr.offer}
                  </button>
                </div>
              </section>
            )}
          </section>
        )}

        {snapshot.data && role === "buyer" && screen === "confirm" && selectedListing && (
          <section className="confirmation-card">
            <span>
              <CheckCircle2 size={46} color="#1F6B45" />
            </span>
            <h2>{tr.confirm}</h2>
            <div>
              <b>{cropLabel(selectedListing.crop)}</b>
              <span>{qty} kg</span>
              <span>{money(selectedListing.pricePerKg)}/kg</span>
              <span>{money(deliveryCost)}/kg delivery</span>
              <strong>
                {tr.total}: {money(totalCost)}
              </strong>
              <em>
                {selectedListing.location} → Vijayawada
              </em>
            </div>
            <button className="market-primary" onClick={confirmOrder} disabled={placeOrder.isPending}>
              <Check size={17} /> {tr.confirm}
            </button>
            <button onClick={() => go("market")}>{tr.cancel}</button>
          </section>
        )}

        {snapshot.data && role === "buyer" && screen === "requirement" && (
          <section className="simple-need">
            <button className="market-back" onClick={() => go("dashboard")}>
              <ArrowLeft size={17} /> {tr.previous}
            </button>
            <h2>{tr.need}</h2>
            <div className="need-grid">
              <label>
                {tr.chooseCrop}
                <select value={needForm.crop} onChange={(event) => setNeedForm({ ...needForm, crop: event.target.value })}>
                  <option>Tomato</option>
                  <option>Rice</option>
                  <option>Onion</option>
                  <option>Potato</option>
                </select>
              </label>
              <label>
                {tr.howMuch}
                <input
                  type="number"
                  value={needForm.quantityKg}
                  onChange={(event) => setNeedForm({ ...needForm, quantityKg: event.target.value })}
                />
              </label>
              <label>
                {tr.maxPrice}
                <input
                  type="number"
                  value={needForm.maxPricePerKg}
                  onChange={(event) => setNeedForm({ ...needForm, maxPricePerKg: event.target.value })}
                />
              </label>
              <label>
                {tr.required}
                <input
                  value={needForm.requiredDate}
                  onChange={(event) => setNeedForm({ ...needForm, requiredDate: event.target.value })}
                />
              </label>
              <label>
                {tr.where}
                <input
                  value={needForm.location}
                  onChange={(event) => setNeedForm({ ...needForm, location: event.target.value })}
                />
              </label>
              <label>
                {tr.quality}
                <select value={needForm.quality} onChange={(event) => setNeedForm({ ...needForm, quality: event.target.value })}>
                  <option>A Grade</option>
                  <option>B Grade</option>
                  <option>C Grade</option>
                </select>
              </label>
            </div>
            <button className="market-primary" onClick={postNeed} disabled={createRequirement.isPending}>
              <Check size={17} /> {tr.postNeed}
            </button>
          </section>
        )}

        {snapshot.data && role === "buyer" && screen === "history" && (
          <section className="purchase-history">
            <div className="section-title">
              <div>
                <span className="market-kicker">
                  <History size={13} /> {tr.history}
                </span>
                <h2>{tr.savings}: ₹8,400</h2>
              </div>
              <button onClick={() => go("market")}>{tr.buyAgain}</button>
            </div>
            {orders.length ? (
              orders.map((order: any) => (
                <article key={order.id}>
                  <img src={cropImages.Tomato} alt="" />
                  <div>
                    <b>{tr.tomato}</b>
                    <span>
                      Lakshmi FPO · {money(order.pricePerKg)}/kg
                    </span>
                    <small>
                      {order.quantityKg} kg · {order.status}
                    </small>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      go("track");
                    }}
                  >
                    {tr.tracking}
                  </button>
                </article>
              ))
            ) : (
              <div className="market-empty">{tr.noListings}</div>
            )}
            <section className="rating-card">
              <h3>{tr.rate}</h3>
              <div>
                {[1, 2, 3, 4, 5].map((item) => (
                  <button
                    className={rating >= item ? "selected" : ""}
                    onClick={() => setRating(item)}
                    key={item}
                    aria-label={`Rate ${item} stars`}
                  >
                    <Star size={28} fill={rating >= item ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
              <textarea placeholder={tr.comment} />
              <button className="market-primary" onClick={() => toast.success(`${rating || 5}/5 ✓`)}>
                {tr.submitRating}
              </button>
            </section>
          </section>
        )}

        {snapshot.data && screen === "track" && (
          <section className="tracking-view">
            <div className="section-title">
              <div>
                <span className="market-kicker">
                  <Truck size={13} /> {tr.logistics}
                </span>
                <h2>{tr.tracking}</h2>
              </div>
              <button onClick={() => go("dashboard")}>{tr.previous}</button>
            </div>
            <RouteVisual location={activeOrder ? "Tenali" : farmer?.location || "Tenali"} destination="Vijayawada" />
            <div className="tracking-steps">
              {[
                ["Confirmed", <Check size={15} />],
                ["Packed", <Package size={15} />],
                ["Picked up", <Truck size={15} />],
                [`28 ${tr.kmAway}`, <MapPin size={15} />],
                [`12 ${tr.kmAway}`, <MapPin size={15} />],
                ["Delivered", <CheckCircle2 size={15} />],
              ].map(([label, iconNode], index) => {
                const isDone =
                  index <=
                  (activeOrder?.status === "delivered" ? 5 : activeOrder?.status === "in_transit" ? 4 : activeOrder?.status === "pickup_planned" ? 2 : 0);
                return (
                  <span className={isDone ? "done" : ""} key={String(label)}>
                    <i>{iconNode as any}</i>
                    {label as string}
                  </span>
                );
              })}
            </div>
            <div className="track-actions">
              <button onClick={() => updateTrack("pickup_planned")}>
                <Package size={15} /> {tr.plan}
              </button>
              <button onClick={() => updateTrack("in_transit")}>
                <Truck size={15} /> {tr.start}
              </button>
              <button className="market-primary" onClick={() => updateTrack("delivered")}>
                <Check size={15} /> {tr.finish}
              </button>
            </div>
          </section>
        )}

        {snapshot.data && role === "admin" && (
          <section className="admin-board">
            <div className="section-title">
              <div>
                <span className="market-kicker">
                  <SlidersHorizontal size={13} /> {tr.admin}
                </span>
                <h2>{tr.adminTitle}</h2>
              </div>
              <button onClick={() => go("track")}>
                <Truck size={15} /> {tr.logistics}
              </button>
            </div>
            <div className="admin-number-grid">
              <article>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#1f6b45", marginBottom: 6 }}>
                  <Sprout size={18} />
                </div>
                <b>{new Set(listings.map((item: any) => item.farmerMobile)).size}</b>
                <span>{tr.farmers}</span>
              </article>
              <article>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#1f6b45", marginBottom: 6 }}>
                  <ShoppingBasket size={18} />
                </div>
                <b>{new Set(requirements.map((item: any) => item.buyerName)).size}</b>
                <span>{tr.buyersLabel}</span>
              </article>
              <article>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#1f6b45", marginBottom: 6 }}>
                  <Package size={18} />
                </div>
                <b>{listings.reduce((sum: number, item: any) => sum + item.availableKg, 0).toLocaleString()} kg</b>
                <span>{tr.active}</span>
              </article>
              <article>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#1f6b45", marginBottom: 6 }}>
                  <ClipboardList size={18} />
                </div>
                <b>{orders.length}</b>
                <span>{tr.orders}</span>
              </article>
              <article>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#1f6b45", marginBottom: 6 }}>
                  <Truck size={18} />
                </div>
                <b>{orders.filter((item: any) => item.status === "delivered").length}</b>
                <span>{tr.deliveries}</span>
              </article>
            </div>
            <section className="gap-board">
              <div>
                <span className="market-kicker">
                  <Package size={13} /> {tr.supplyDemand}
                </span>
                <h2>{tr.tomato}</h2>
                <div className="gap-bars">
                  <span style={{ width: `${Math.min(100, (supply / Math.max(demand, 1)) * 100)}%` }}>
                    {tr.supply}: {supply.toLocaleString()} kg
                  </span>
                  <span className="demand-bar" style={{ width: "100%" }}>
                    {tr.demandLabel}: {demand.toLocaleString()} kg
                  </span>
                </div>
                <strong className={demand > supply ? "shortage" : "surplus"}>
                  {demand > supply
                    ? `${tr.shortage}: ${(demand - supply).toLocaleString()} kg`
                    : `${tr.surplus}: ${(supply - demand).toLocaleString()} kg`}
                </strong>
              </div>
              <div className="admin-ai">
                <Bot size={27} />
                <b>AI Guidance</b>
                <span>
                  {tr.high} {tr.demand} · ₹30–₹34/kg · {tr.logistics}
                </span>
              </div>
            </section>
          </section>
        )}
      </section>
    </main>
  );
}
