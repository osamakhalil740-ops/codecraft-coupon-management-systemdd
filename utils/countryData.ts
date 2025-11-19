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