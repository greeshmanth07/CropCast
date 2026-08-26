export interface SouthIndiaLocation {
  city: string;
  district: string;
  state: string;
  marketHub?: string;
  lat?: number;
  lng?: number;
}

export const SOUTH_INDIA_LOCATIONS: SouthIndiaLocation[] = [
  // Andhra Pradesh
  { city: "Guntur", district: "Guntur", state: "Andhra Pradesh", marketHub: "Guntur Mirchi Yard", lat: 16.3067, lng: 80.4365 },
  { city: "Vijayawada", district: "NTR", state: "Andhra Pradesh", marketHub: "Gollapudi Market", lat: 16.5062, lng: 80.6480 },
  { city: "Tenali", district: "Guntur", state: "Andhra Pradesh", marketHub: "Tenali Mandi", lat: 16.2435, lng: 80.6400 },
  { city: "Kurnool", district: "Kurnool", state: "Andhra Pradesh", marketHub: "Kurnool Agricultural Market", lat: 15.8281, lng: 78.0373 },
  { city: "Nandyal", district: "Nandyal", state: "Andhra Pradesh", marketHub: "Nandyal Market Yard", lat: 15.4884, lng: 78.4862 },
  { city: "Adoni", district: "Kurnool", state: "Andhra Pradesh", marketHub: "Adoni Cotton Market", lat: 15.6322, lng: 77.2728 },
  { city: "Duggirala", district: "Guntur", state: "Andhra Pradesh", marketHub: "Duggirala Turmeric Market", lat: 16.3262, lng: 80.6276 },
  { city: "Narasaraopet", district: "Palnadu", state: "Andhra Pradesh", marketHub: "Narasaraopet Mandi", lat: 16.2359, lng: 80.0499 },
  { city: "Chilakaluripet", district: "Palnadu", state: "Andhra Pradesh", marketHub: "Chilakaluripet Market", lat: 16.0892, lng: 80.1670 },
  { city: "Rajahmundry", district: "East Godavari", state: "Andhra Pradesh", marketHub: "Rajahmundry Mandi", lat: 17.0005, lng: 81.8040 },
  { city: "Eluru", district: "Eluru", state: "Andhra Pradesh", marketHub: "Eluru Agricultural Market", lat: 16.7107, lng: 81.0952 },
  { city: "Visakhapatnam", district: "Visakhapatnam", state: "Andhra Pradesh", marketHub: "Anakapalle Jaggery/Grain Market", lat: 17.6868, lng: 83.2185 },
  { city: "Tirupati", district: "Tirupati", state: "Andhra Pradesh", marketHub: "Tirupati Mandi", lat: 13.6288, lng: 79.4192 },
  { city: "Anantapur", district: "Anantapur", state: "Andhra Pradesh", marketHub: "Anantapur Groundnut Yard", lat: 14.6819, lng: 77.6006 },
  { city: "Kadapa", district: "YSR Kadapa", state: "Andhra Pradesh", marketHub: "Kadapa Market Yard", lat: 14.4673, lng: 78.8242 },
  { city: "Ongole", district: "Prakasam", state: "Andhra Pradesh", marketHub: "Ongole Tobacco & Grain Mandi", lat: 15.5057, lng: 80.0499 },
  { city: "Nellore", district: "SPSR Nellore", state: "Andhra Pradesh", marketHub: "Nellore Rice & Aqua Market", lat: 14.4426, lng: 79.9865 },
  { city: "Chittoor", district: "Chittoor", state: "Andhra Pradesh", marketHub: "Chittoor Mango & Tomato Mandi", lat: 13.2172, lng: 79.1003 },
  { city: "Madanapalle", district: "Annamayya", state: "Andhra Pradesh", marketHub: "Madanapalle Tomato Market", lat: 13.5560, lng: 78.5010 },

  // Telangana
  { city: "Hyderabad", district: "Hyderabad", state: "Telangana", marketHub: "Bowenpally / Gaddiannaram Fruit Market", lat: 17.3850, lng: 78.4867 },
  { city: "Warangal", district: "Warangal", state: "Telangana", marketHub: "Enumamula Agricultural Market", lat: 17.9689, lng: 79.5941 },
  { city: "Khammam", district: "Khammam", state: "Telangana", marketHub: "Khammam Chilli & Cotton Market", lat: 17.2473, lng: 80.1514 },
  { city: "Nizamabad", district: "Nizamabad", state: "Telangana", marketHub: "Nizamabad Turmeric & Grain Market", lat: 18.6725, lng: 78.0941 },
  { city: "Karimnagar", district: "Karimnagar", state: "Telangana", marketHub: "Karimnagar Market Yard", lat: 18.4386, lng: 79.1288 },
  { city: "Mahabubnagar", district: "Mahabubnagar", state: "Telangana", marketHub: "Badepally Mandi", lat: 16.7488, lng: 77.9856 },
  { city: "Nalgonda", district: "Nalgonda", state: "Telangana", marketHub: "Miryalaguda Rice Mandi", lat: 17.0577, lng: 79.2684 },
  { city: "Siddipet", district: "Siddipet", state: "Telangana", marketHub: "Siddipet Market Yard", lat: 18.1018, lng: 78.8520 },
  { city: "Suryapet", district: "Suryapet", state: "Telangana", marketHub: "Suryapet Market Yard", lat: 17.1439, lng: 79.6239 },
  { city: "Adilabad", district: "Adilabad", state: "Telangana", marketHub: "Adilabad Cotton Mandi", lat: 19.6641, lng: 78.5320 },

  // Karnataka
  { city: "Bengaluru", district: "Bengaluru Urban", state: "Karnataka", marketHub: "Yeshwanthpur APMC Yard", lat: 12.9716, lng: 77.5946 },
  { city: "Mysuru", district: "Mysuru", state: "Karnataka", marketHub: "Bandipalya APMC Yard", lat: 12.2958, lng: 76.6394 },
  { city: "Hubballi", district: "Dharwad", state: "Karnataka", marketHub: "Hubballi APMC Mandi", lat: 15.3647, lng: 75.1240 },
  { city: "Ballari", district: "Ballari", state: "Karnataka", marketHub: "Ballari APMC Cotton & Chilli Yard", lat: 15.1394, lng: 76.9214 },
  { city: "Belagavi", district: "Belagavi", state: "Karnataka", marketHub: "Belagavi Vegetable APMC", lat: 15.8497, lng: 74.4977 },
  { city: "Kolar", district: "Kolar", state: "Karnataka", marketHub: "Kolar Tomato APMC Market", lat: 13.1367, lng: 78.1291 },
  { city: "Davanagere", district: "Davanagere", state: "Karnataka", marketHub: "Davanagere Maize Market", lat: 14.4644, lng: 75.9218 },
  { city: "Shivamogga", district: "Shivamogga", state: "Karnataka", marketHub: "Shivamogga Arecanut Mandi", lat: 13.9299, lng: 75.5681 },
  { city: "Tumakuru", district: "Tumakuru", state: "Karnataka", marketHub: "Tumakuru Coconut & Copra APMC", lat: 13.3379, lng: 77.1010 },

  // Tamil Nadu
  { city: "Chennai", district: "Chennai", state: "Tamil Nadu", marketHub: "Koyambedu Wholesale Market Complex", lat: 13.0827, lng: 80.2707 },
  { city: "Coimbatore", district: "Coimbatore", state: "Tamil Nadu", marketHub: "MGR Wholesale Vegetable Market", lat: 11.0168, lng: 76.9558 },
  { city: "Madurai", district: "Madurai", state: "Tamil Nadu", marketHub: "Mattuthavani Central Market", lat: 9.9252, lng: 78.1198 },
  { city: "Tiruchirappalli", district: "Tiruchirappalli", state: "Tamil Nadu", marketHub: "Gandhi Market Trichy", lat: 10.7905, lng: 78.7047 },
  { city: "Salem", district: "Salem", state: "Tamil Nadu", marketHub: "Leigh Bazaar Salem", lat: 11.6643, lng: 78.1460 },
  { city: "Erode", district: "Erode", state: "Tamil Nadu", marketHub: "Erode Turmeric & Textile Market", lat: 11.3410, lng: 77.7172 },
  { city: "Tirunelveli", district: "Tirunelveli", state: "Tamil Nadu", marketHub: "Tirunelveli Central Market", lat: 8.7139, lng: 77.7567 },
  { city: "Dindigul", district: "Dindigul", state: "Tamil Nadu", marketHub: "Dindigul Onion & Fruit Market", lat: 10.3673, lng: 77.9803 },

  // Kerala
  { city: "Kochi", district: "Ernakulam", state: "Kerala", marketHub: "Ernakulam Broadway & Spices Market", lat: 9.9312, lng: 76.2673 },
  { city: "Thiruvananthapuram", district: "Thiruvananthapuram", state: "Kerala", marketHub: "Chalavari / Chala Market", lat: 8.5241, lng: 76.9366 },
  { city: "Kozhikode", district: "Kozhikode", state: "Kerala", marketHub: "Valayanad / Palayam Market", lat: 11.2588, lng: 75.7804 },
  { city: "Palakkad", district: "Palakkad", state: "Kerala", marketHub: "Palakkad Paddy Market", lat: 10.7867, lng: 76.6548 },
  { city: "Thrissur", district: "Thrissur", state: "Kerala", marketHub: "Thrissur Sakthan Thampuran Market", lat: 10.5276, lng: 76.2144 },
];

export function searchSouthIndiaLocations(query: string, limit = 6): SouthIndiaLocation[] {
  const q = query.trim().toLowerCase();
  if (!q) return SOUTH_INDIA_LOCATIONS.slice(0, limit);

  return SOUTH_INDIA_LOCATIONS.filter((loc) => {
    return (
      loc.city.toLowerCase().includes(q) ||
      loc.district.toLowerCase().includes(q) ||
      loc.state.toLowerCase().includes(q) ||
      (loc.marketHub && loc.marketHub.toLowerCase().includes(q))
    );
  }).slice(0, limit);
}

export function formatLocationString(loc: SouthIndiaLocation): string {
  return `${loc.city}, ${loc.state}`;
}

export function findNearestSouthIndiaLocation(lat: number, lng: number): SouthIndiaLocation {
  let nearest = SOUTH_INDIA_LOCATIONS[0];
  let minDistance = Number.MAX_VALUE;

  for (const loc of SOUTH_INDIA_LOCATIONS) {
    if (loc.lat !== undefined && loc.lng !== undefined) {
      const d = Math.hypot(loc.lat - lat, loc.lng - lng);
      if (d < minDistance) {
        minDistance = d;
        nearest = loc;
      }
    }
  }

  return nearest;
}
