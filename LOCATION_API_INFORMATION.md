# 🌍 Location API Service Information

## Service Being Used

**Service Name:** GeoNames  
**Website:** https://www.geonames.org  
**Account Management:** https://www.geonames.org/login

---

## 📋 Service Details

### What is GeoNames?
GeoNames is a geographical database that covers all countries and contains over eleven million place names. It provides free access to location data including:

- **195+ Countries** - All countries worldwide
- **4+ Million Cities** - Major and minor cities globally
- **Millions of Districts/Neighborhoods** - Detailed location data
- **11+ Million Geographical Names** - Comprehensive coverage

---

## 🔑 Your Account Information

### Account Login
- **Website:** https://www.geonames.org/login
- **Email:** osamakhalil740@gmail.com *(Use your registered email)*

### To Check Your Usage:
1. Go to https://www.geonames.org/login
2. Log in with your credentials
3. Click on **"Web Services"** in your account menu
4. View **"Usage Statistics"** to see:
   - Daily request count
   - Hourly request count
   - Historical usage data
   - Current plan limits

---

## 📊 Current Plan Details

### Free Tier Limitations:
- ✅ **20,000 requests per day**
- ✅ **1,000 requests per hour**
- ✅ **Unlimited time period** (no expiration)
- ✅ **All location data included**

### What We're Using:
- Country listings (195+ countries)
- City searches (4+ million cities)
- District/neighborhood data
- Location search functionality

---

## 💰 Pricing & Plans

### Free Plan (Current)
- **Cost:** $0/month
- **Daily Limit:** 20,000 requests
- **Hourly Limit:** 1,000 requests
- **Perfect for:** Small to medium applications

### Premium Plans (If Needed)
If you need higher limits, GeoNames offers premium plans:

- **Premium Plan:** Higher request limits
- **Enterprise:** Unlimited requests
- **Custom Solutions:** Tailored to your needs

**To upgrade:** Visit https://www.geonames.org/commercial-webservices.html

---

## 🔧 How It's Configured

### Environment Variable
The service is configured using:
```
VITE_GEONAMES_USERNAME=your_username_here
```

### API Endpoint
```
https://secure.geonames.org
```

### Services Used:
1. **Country Search** - `countryInfoJSON`
2. **City Search** - `searchJSON`
3. **Location Lookup** - `getJSON`
4. **Neighborhood/District Search** - `findNearbyJSON`

---

## 📈 Usage Monitoring

### Check Your Usage:
1. **Login:** https://www.geonames.org/login
2. **Navigate to:** Account → Web Services → Statistics
3. **View:**
   - Today's usage
   - This hour's usage
   - Daily/weekly/monthly trends
   - API call details

### Usage Dashboard Shows:
- Total API calls made
- Remaining daily quota
- Remaining hourly quota
- Historical usage graphs
- Most used API endpoints

---

## 🔄 Caching Strategy

To reduce API calls and stay within limits, we implemented:

### Firebase Caching
- ✅ **30-day cache** for location data
- ✅ Stores results in Firestore
- ✅ Reduces duplicate API calls
- ✅ Faster response times

### Cache Benefits:
- Same location queries don't hit API multiple times
- Reduced bandwidth usage
- Faster user experience
- Stays well within free tier limits

---

## 📊 Expected Usage for Your Application

### Estimated API Calls:
- **Country List:** 1 call (cached for 30 days)
- **City Searches:** ~10-50 per day (cached per search)
- **District Searches:** ~20-100 per day (cached per search)
- **Location Searches:** ~50-200 per day (cached per search)

### Total Expected Daily Usage:
**~100-400 requests per day** (well within 20,000 limit)

With caching, most repeat queries don't hit the API, so actual usage is minimal.

---

## ✅ Setup Verification

### To Verify Your Account:
1. Go to https://www.geonames.org/login
2. Log in to your account
3. Click **"Click here to enable"** for Free Web Services
4. Confirm your username is active

### Account Status Check:
- ✅ Account created
- ✅ Email verified
- ✅ Free web services enabled
- ✅ Username configured in application

---

## 🆘 Support & Help

### GeoNames Support:
- **Forum:** https://forum.geonames.org
- **FAQ:** https://www.geonames.org/export/
- **Contact:** Through website contact form

### Common Issues:
1. **"User does not exist"** - Enable web services in your account
2. **"Daily limit exceeded"** - Wait until next day or upgrade plan
3. **"Hourly limit exceeded"** - Wait until next hour

---

## 📞 Quick Links

| Resource | URL |
|----------|-----|
| **Login Page** | https://www.geonames.org/login |
| **Account Settings** | https://www.geonames.org/manageaccount |
| **Usage Statistics** | https://www.geonames.org/login (then Web Services → Statistics) |
| **Web Services Info** | https://www.geonames.org/export/web-services.html |
| **Premium Plans** | https://www.geonames.org/commercial-webservices.html |
| **API Documentation** | https://www.geonames.org/export/ws-overview.html |

---

## 🔐 Security Notes

### Important:
- ✅ Username is stored in environment variables (not in code)
- ✅ HTTPS used for all API calls
- ✅ No sensitive data exposed
- ✅ Firebase caching reduces external calls

### Your Username:
- Check `.env.local` or environment variables
- Look for: `VITE_GEONAMES_USERNAME=your_username`

---

## 📝 Summary

**Service:** GeoNames (www.geonames.org)  
**Cost:** FREE  
**Current Usage:** ~100-400 requests/day  
**Daily Limit:** 20,000 requests/day  
**Status:** Well within free tier limits  
**Recommendation:** Current free plan is sufficient

### Action Required:
1. ✅ Login to https://www.geonames.org/login
2. ✅ Verify "Free Web Services" are enabled
3. ✅ Check usage statistics in your dashboard
4. ✅ Confirm your username is active

---

## 📧 Client Information for GeoNames

**To provide to the service if needed:**
- Website: https://effortless-coupon-management.web.app
- Application: Coupon Management System
- Purpose: Location-based coupon filtering and search
- Expected Usage: ~100-400 requests per day
- Plan: Free Tier

---

**Last Updated:** December 2024  
**Service Status:** ✅ Active and Operational
