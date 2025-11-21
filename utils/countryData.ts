// Country and city data for dynamic selectors
export const countryData = {
  "United States": {
    cities: {
      "New York": ["Manhattan", "Brooklyn", "Queens", "The Bronx", "Staten Island"],
      "Los Angeles": ["Hollywood", "Beverly Hills", "Santa Monica", "Downtown LA", "West Hollywood"],
      "Chicago": ["Downtown", "North Side", "South Side", "West Side", "Lincoln Park"],
      "Houston": ["Downtown", "Uptown", "Midtown", "River Oaks", "The Heights"],
      "Miami": ["South Beach", "Downtown", "Brickell", "Coral Gables", "Wynwood"]
    }
  },
  "United Kingdom": {
    cities: {
      "London": ["Central London", "East London", "West London", "North London", "South London"],
      "Manchester": ["City Centre", "Northern Quarter", "Didsbury", "Chorlton", "Salford"],
      "Birmingham": ["City Centre", "Jewellery Quarter", "Moseley", "Edgbaston", "Digbeth"],
      "Edinburgh": ["Old Town", "New Town", "Leith", "Stockbridge", "Morningside"],
      "Liverpool": ["City Centre", "Albert Dock", "Cavern Quarter", "Georgian Quarter", "Ropewalks"]
    }
  },
  "Canada": {
    cities: {
      "Toronto": ["Downtown", "North York", "Scarborough", "Etobicoke", "East York"],
      "Vancouver": ["Downtown", "West End", "Kitsilano", "Richmond", "Burnaby"],
      "Montreal": ["Downtown", "Old Montreal", "Plateau", "Mile End", "Westmount"],
      "Calgary": ["Downtown", "Beltline", "Kensington", "Hillhurst", "Mission"],
      "Ottawa": ["ByWard Market", "Glebe", "Westboro", "Sandy Hill", "Centretown"]
    }
  },
  "Australia": {
    cities: {
      "Sydney": ["CBD", "Bondi", "Manly", "Surry Hills", "Paddington"],
      "Melbourne": ["CBD", "St Kilda", "Fitzroy", "Carlton", "South Yarra"],
      "Brisbane": ["CBD", "South Bank", "Fortitude Valley", "New Farm", "West End"],
      "Perth": ["CBD", "Fremantle", "Subiaco", "Cottesloe", "Northbridge"],
      "Adelaide": ["CBD", "North Adelaide", "Glenelg", "Port Adelaide", "Norwood"]
    }
  },
  "Germany": {
    cities: {
      "Berlin": ["Mitte", "Kreuzberg", "Prenzlauer Berg", "Charlottenburg", "Friedrichshain"],
      "Munich": ["Altstadt", "Maxvorstadt", "Schwabing", "Glockenbachviertel", "Haidhausen"],
      "Hamburg": ["Altstadt", "St. Pauli", "Eppendorf", "Winterhude", "HafenCity"],
      "Frankfurt": ["Altstadt", "Sachsenhausen", "Westend", "Nordend", "Bornheim"],
      "Cologne": ["Altstadt", "Ehrenfeld", "Belgisches Viertel", "Südstadt", "Deutz"]
    }
  },
  "France": {
    cities: {
      "Paris": ["1st Arrondissement", "Marais", "Saint-Germain", "Montmartre", "Latin Quarter"],
      "Lyon": ["Presqu'île", "Vieux Lyon", "Croix-Rousse", "Part-Dieu", "Confluence"],
      "Marseille": ["Vieux-Port", "Le Panier", "Cours Julien", "Notre-Dame du Mont", "Endoume"],
      "Nice": ["Old Town", "Promenade des Anglais", "Liberation", "Cimiez", "Port"],
      "Toulouse": ["Capitole", "Saint-Cyprien", "Carmes", "Saint-Étienne", "Minimes"]
    }
  },
  "UAE": {
    cities: {
      "Dubai": ["Downtown", "Marina", "JBR", "Business Bay", "Jumeirah"],
      "Abu Dhabi": ["Downtown", "Corniche", "Khalifa City", "Marina", "Yas Island"],
      "Sharjah": ["City Centre", "Al Majaz", "Al Qasba", "University City", "Industrial Area"],
      "Ajman": ["City Centre", "Al Nuaimiya", "Al Rashidiya", "Industrial Area", "Corniche"],
      "Fujairah": ["City Centre", "Corniche", "Dibba", "Kalba", "Khor Fakkan"]
    }
  },
  "Saudi Arabia": {
    cities: {
      "Riyadh": ["Olaya", "Malaz", "Diplomatic Quarter", "King Fahd District", "Al Nakheel"],
      "Jeddah": ["Al-Balad", "Corniche", "Al Hamra", "Al Rawdah", "Al Salamah"],
      "Mecca": ["Haram", "Ajyad", "Kudai", "Al Shubayqah", "Jabal Omar"],
      "Medina": ["Haram", "Quba", "Al Anbariyyah", "As Salam", "Al Haram"],
      "Dammam": ["Al Faisaliyah", "Al Badiyah", "Al Shati", "Al Manar", "Uhud"]
    }
  },
  "Japan": {
    cities: {
      "Tokyo": ["Shibuya", "Shinjuku", "Ginza", "Harajuku", "Akihabara", "Roppongi", "Asakusa"],
      "Osaka": ["Dotonbori", "Namba", "Umeda", "Tennoji", "Shinsekai", "Sumiyoshi"],
      "Kyoto": ["Gion", "Arashiyama", "Fushimi", "Higashiyama", "Kiyomizu", "Pontocho"],
      "Yokohama": ["Minato Mirai", "Chinatown", "Kohoku", "Kanazawa", "Tsurumi"],
      "Nagoya": ["Sakae", "Nagoya Station", "Osu", "Kanayama", "Chikusa"]
    }
  },
  "China": {
    cities: {
      "Beijing": ["Dongcheng", "Xicheng", "Chaoyang", "Fengtai", "Haidian"],
      "Shanghai": ["Huangpu", "Pudong", "Xuhui", "Changning", "Jing'an"],
      "Guangzhou": ["Tianhe", "Yuexiu", "Liwan", "Haizhu", "Baiyun"],
      "Shenzhen": ["Futian", "Luohu", "Nanshan", "Yantian", "Baoan"],
      "Chengdu": ["Jinjiang", "Qingyang", "Jinniu", "Wuhou", "Chenghua"]
    }
  },
  "India": {
    cities: {
      "Mumbai": ["South Mumbai", "Bandra", "Andheri", "Powai", "Thane"],
      "Delhi": ["Connaught Place", "Khan Market", "Karol Bagh", "Lajpat Nagar", "Greater Kailash"],
      "Bangalore": ["MG Road", "Koramangala", "Indiranagar", "Whitefield", "Electronic City"],
      "Chennai": ["T. Nagar", "Anna Nagar", "Adyar", "Velachery", "OMR"],
      "Hyderabad": ["Banjara Hills", "Jubilee Hills", "Gachibowli", "Hitech City", "Secunderabad"],
      "Pune": ["Koregaon Park", "Hinjewadi", "Viman Nagar", "Kothrud", "Wakad"]
    }
  },
  "Brazil": {
    cities: {
      "São Paulo": ["Vila Madalena", "Jardins", "Itaim Bibi", "Vila Olímpia", "Moema"],
      "Rio de Janeiro": ["Copacabana", "Ipanema", "Leblon", "Botafogo", "Centro"],
      "Brasília": ["Asa Sul", "Asa Norte", "Lago Sul", "Lago Norte", "Águas Claras"],
      "Salvador": ["Pelourinho", "Barra", "Rio Vermelho", "Pituba", "Ondina"],
      "Fortaleza": ["Meireles", "Aldeota", "Centro", "Praia de Iracema", "Cocó"]
    }
  },
  "Mexico": {
    cities: {
      "Mexico City": ["Polanco", "Roma Norte", "Condesa", "Coyoacán", "Santa Fe"],
      "Guadalajara": ["Zona Rosa", "Chapultepec", "Centro Histórico", "Providencia", "Tlaquepaque"],
      "Monterrey": ["San Pedro", "Centro", "Santa Catarina", "San Nicolás", "Apodaca"],
      "Cancún": ["Hotel Zone", "Downtown", "Puerto Juárez", "Isla Mujeres", "Playa del Carmen"],
      "Tijuana": ["Zona Centro", "Zona Río", "Playas", "Mesa de Otay", "La Mesa"]
    }
  },
  "Argentina": {
    cities: {
      "Buenos Aires": ["Palermo", "Recoleta", "San Telmo", "Puerto Madero", "Belgrano"],
      "Córdoba": ["Nueva Córdoba", "Centro", "Güemes", "Cerro de las Rosas", "Alberdi"],
      "Rosario": ["Centro", "Echesortu", "Pichincha", "Fisherton", "Zona Norte"],
      "Mendoza": ["Ciudad", "Godoy Cruz", "Las Heras", "Guaymallén", "Maipú"],
      "Mar del Plata": ["Centro", "La Perla", "Güemes", "Los Troncos", "Playa Grande"]
    }
  },
  "Italy": {
    cities: {
      "Rome": ["Centro Storico", "Trastevere", "Vatican", "Testaccio", "Monti"],
      "Milan": ["Centro", "Brera", "Navigli", "Porta Nuova", "Isola"],
      "Naples": ["Centro Storico", "Vomero", "Chiaia", "Posillipo", "Quartieri Spagnoli"],
      "Florence": ["Centro Storico", "Oltrarno", "Santa Croce", "San Lorenzo", "Santo Spirito"],
      "Venice": ["San Marco", "Castello", "Cannaregio", "Dorsoduro", "San Polo"]
    }
  },
  "Spain": {
    cities: {
      "Madrid": ["Centro", "Salamanca", "Chamberí", "Retiro", "Malasaña"],
      "Barcelona": ["Eixample", "Ciutat Vella", "Gràcia", "Sants", "Les Corts"],
      "Valencia": ["Ciutat Vella", "Eixample", "Extramurs", "Campanar", "Algirós"],
      "Seville": ["Centro", "Triana", "Macarena", "Nervión", "Los Remedios"],
      "Bilbao": ["Casco Viejo", "Ensanche", "Deusto", "Indautxu", "Abando"]
    }
  },
  "Netherlands": {
    cities: {
      "Amsterdam": ["Centrum", "Jordaan", "De Pijp", "Oud-Zuid", "Noord"],
      "Rotterdam": ["Centrum", "Kralingen", "Feijenoord", "Delfshaven", "Noord"],
      "The Hague": ["Centrum", "Scheveningen", "Bezuidenhout", "Escamp", "Laak"],
      "Utrecht": ["Binnenstad", "Lombok", "Oudwijk", "Wittevrouwen", "Zuilen"],
      "Eindhoven": ["Centrum", "Strijp", "Tongelre", "Woensel", "Gestel"]
    }
  },
  "Switzerland": {
    cities: {
      "Zurich": ["Altstadt", "Kreis 4", "Seefeld", "Wiedikon", "Aussersihl"],
      "Geneva": ["Vieille Ville", "Eaux-Vives", "Plainpalais", "Pâquis", "Carouge"],
      "Basel": ["Grossbasel", "Kleinbasel", "Riehen", "Bettingen", "Allschwil"],
      "Bern": ["Altstadt", "Länggasse", "Kirchenfeld", "Breitenrain", "Mattenhof"],
      "Lausanne": ["Centre", "Ouchy", "Montbenon", "Flon", "Malley"]
    }
  },
  "Sweden": {
    cities: {
      "Stockholm": ["Gamla Stan", "Södermalm", "Östermalm", "Norrmalm", "Vasastan"],
      "Gothenburg": ["Centrum", "Majorna", "Hisingen", "Angered", "Örgryte"],
      "Malmö": ["Centrum", "Västra Hamnen", "Rosengård", "Fosie", "Limhamn"],
      "Uppsala": ["Centrum", "Luthagen", "Stenhagen", "Gottsunda", "Vårdsätra"],
      "Västerås": ["Centrum", "Bäckby", "Bjurhovda", "Kristiansborg", "Hammarby"]
    }
  },
  "Norway": {
    cities: {
      "Oslo": ["Sentrum", "Grünerløkka", "Majorstuen", "Frogner", "St. Hanshaugen"],
      "Bergen": ["Sentrum", "Nordnes", "Møhlenpris", "Sandviken", "Fyllingsdalen"],
      "Trondheim": ["Midtbyen", "Bakklandet", "Lademoen", "Byåsen", "Heimdal"],
      "Stavanger": ["Sentrum", "Eiganes", "Hillevåg", "Hundvåg", "Storhaug"],
      "Tromsø": ["Sentrum", "Tromsdalen", "Kvaløysletta", "Langnes", "Breivika"]
    }
  },
  "Denmark": {
    cities: {
      "Copenhagen": ["Indre By", "Vesterbro", "Østerbro", "Nørrebro", "Frederiksberg"],
      "Aarhus": ["Midtbyen", "Frederiksbjerg", "Trøjborg", "Viby", "Brabrand"],
      "Odense": ["Centrum", "Vollsmose", "Tarup", "Bolbro", "Korup"],
      "Aalborg": ["Centrum", "Hasseris", "Vejgaard", "Østerå", "Vestbyen"],
      "Esbjerg": ["Centrum", "Sønderris", "Østerbyen", "Folevej", "Jerne"]
    }
  },
  "Finland": {
    cities: {
      "Helsinki": ["Keskusta", "Punavuori", "Kamppi", "Kallio", "Töölö"],
      "Espoo": ["Keskus", "Tapiola", "Leppävaara", "Matinkylä", "Espoonlahti"],
      "Tampere": ["Keskusta", "Kaleva", "Hervanta", "Härmälä", "Tesoma"],
      "Vantaa": ["Keskus", "Tikkurila", "Hakunila", "Korso", "Aviapolis"],
      "Turku": ["Keskusta", "Nummi", "Uittamo", "Varissuo", "Runosmäki"]
    }
  },
  "South Korea": {
    cities: {
      "Seoul": ["Gangnam", "Hongdae", "Itaewon", "Myeongdong", "Insadong"],
      "Busan": ["Haeundae", "Seomyeon", "Nampo", "Centum City", "Jagalchi"],
      "Incheon": ["Jung-gu", "Yeonsu", "Namdong", "Bupyeong", "Seo-gu"],
      "Daegu": ["Jung-gu", "Suseong", "Dalseo", "Buk-gu", "Dong-gu"],
      "Daejeon": ["Seo-gu", "Yuseong", "Jung-gu", "Dong-gu", "Daedeok"]
    }
  },
  "Singapore": {
    cities: {
      "Singapore": ["Marina Bay", "Orchard", "Chinatown", "Little India", "Sentosa", "Jurong", "Tampines"]
    }
  },
  "Hong Kong": {
    cities: {
      "Hong Kong": ["Central", "Tsim Sha Tsui", "Causeway Bay", "Wan Chai", "Mong Kok", "Admiralty"]
    }
  },
  "Thailand": {
    cities: {
      "Bangkok": ["Sukhumvit", "Silom", "Chatuchak", "Thonburi", "Dusit"],
      "Phuket": ["Patong", "Kata", "Karon", "Rawai", "Kamala"],
      "Chiang Mai": ["Old City", "Nimmanhaemin", "Chang Khlan", "Huay Kaew", "San Sai"],
      "Pattaya": ["Central Pattaya", "North Pattaya", "South Pattaya", "Jomtien", "Naklua"],
      "Krabi": ["Ao Nang", "Railay", "Klong Muang", "Tup Kaek", "Nopparat Thara"]
    }
  },
  "Malaysia": {
    cities: {
      "Kuala Lumpur": ["KLCC", "Bukit Bintang", "Chinatown", "Little India", "Mont Kiara"],
      "George Town": ["Georgetown", "Gurney Drive", "Bayan Lepas", "Jelutong", "Air Itam"],
      "Johor Bahru": ["City Centre", "Skudai", "Nusajaya", "Pasir Gudang", "Kulai"],
      "Kota Kinabalu": ["City Centre", "Likas", "Penampang", "Inanam", "Sepanggar"],
      "Kuching": ["City Centre", "Petra Jaya", "Tabuan Heights", "BDC", "Samariang"]
    }
  },
  "Indonesia": {
    cities: {
      "Jakarta": ["Central Jakarta", "South Jakarta", "West Jakarta", "East Jakarta", "North Jakarta"],
      "Surabaya": ["Pusat", "Timur", "Selatan", "Barat", "Utara"],
      "Bandung": ["Bandung Wetan", "Bandung Kulon", "Bojongloa Kaler", "Cicendo", "Coblong"],
      "Medan": ["Medan Kota", "Medan Baru", "Medan Timur", "Medan Barat", "Medan Utara"],
      "Bali": ["Denpasar", "Ubud", "Sanur", "Seminyak", "Canggu"]
    }
  },
  "Philippines": {
    cities: {
      "Manila": ["Ermita", "Malate", "Intramuros", "Binondo", "Quiapo"],
      "Cebu": ["Lahug", "IT Park", "Ayala Center", "Colon", "Banilad"],
      "Davao": ["Poblacion", "Buhangin", "Tugbok", "Calinan", "Marilog"],
      "Makati": ["Poblacion", "Salcedo Village", "Legaspi Village", "Bel-Air", "San Lorenzo"],
      "Quezon City": ["Diliman", "Cubao", "Project 4", "Novaliches", "Fairview"]
    }
  },
  "Vietnam": {
    cities: {
      "Ho Chi Minh City": ["District 1", "District 3", "District 7", "Binh Thanh", "Phu Nhuan"],
      "Hanoi": ["Hoan Kiem", "Ba Dinh", "Dong Da", "Hai Ba Trung", "Cau Giay"],
      "Da Nang": ["Hai Chau", "Thanh Khe", "Son Tra", "Ngu Hanh Son", "Lien Chieu"],
      "Hoi An": ["Ancient Town", "Cam Chau", "Cam Ha", "Cam An", "Tan An"],
      "Nha Trang": ["Vinh Hai", "Vinh Phuoc", "Loc Tho", "Phuoc Hai", "Van Thang"]
    }
  },
  "South Africa": {
    cities: {
      "Cape Town": ["City Bowl", "Waterfront", "Sea Point", "Camps Bay", "Observatory"],
      "Johannesburg": ["Sandton", "Rosebank", "Melville", "Braamfontein", "Soweto"],
      "Durban": ["Central", "Umhlanga", "Morningside", "Berea", "Westville"],
      "Pretoria": ["Central", "Hatfield", "Menlyn", "Brooklyn", "Centurion"],
      "Port Elizabeth": ["Central", "Summerstrand", "Walmer", "Newton Park", "Humewood"]
    }
  },
  "Nigeria": {
    cities: {
      "Lagos": ["Victoria Island", "Ikoyi", "Lekki", "Ikeja", "Surulere"],
      "Abuja": ["Central Area", "Wuse", "Garki", "Asokoro", "Maitama"],
      "Kano": ["Fagge", "Dala", "Gwale", "Kano Municipal", "Tarauni"],
      "Ibadan": ["Ibadan North", "Ibadan South-West", "Egbeda", "Oluyole", "Akinyele"],
      "Port Harcourt": ["Port Harcourt City", "Obio-Akpor", "Eleme", "Ikwerre", "Emohua"]
    }
  },
  "Egypt": {
    cities: {
      "Cairo": ["Downtown", "Zamalek", "Maadi", "Heliopolis", "New Cairo"],
      "Alexandria": ["Downtown", "Montaza", "Sidi Gaber", "Smouha", "Miami"],
      "Giza": ["Dokki", "Mohandessin", "6th of October", "Sheikh Zayed", "Haram"],
      "Luxor": ["East Bank", "West Bank", "Karnak", "Valley of Kings", "Downtown"],
      "Aswan": ["Downtown", "Elephantine Island", "West Bank", "Nubian Village", "High Dam"]
    }
  },
  "Kenya": {
    cities: {
      "Nairobi": ["CBD", "Westlands", "Karen", "Kilimani", "Lavington"],
      "Mombasa": ["Old Town", "Nyali", "Bamburi", "Kisauni", "Changamwe"],
      "Kisumu": ["Central", "Milimani", "Nyalenda", "Kondele", "Mamboleo"],
      "Nakuru": ["Central", "Section 58", "Milimani", "London", "Kaptembwo"],
      "Eldoret": ["Central", "Pioneer", "Langas", "West Indies", "Elgon View"]
    }
  }
};

export const getAllCountries = (): string[] => {
  return Object.keys(countryData);
};

export const getCitiesForCountry = (country: string): string[] => {
  const countryInfo = countryData[country as keyof typeof countryData];
  return countryInfo ? Object.keys(countryInfo.cities) : [];
};

export const getDistrictsForCity = (country: string, city: string): string[] => {
  const countryInfo = countryData[country as keyof typeof countryData];
  if (!countryInfo) return [];
  
  const cityInfo = countryInfo.cities[city as keyof typeof countryInfo.cities];
  return cityInfo || [];
};