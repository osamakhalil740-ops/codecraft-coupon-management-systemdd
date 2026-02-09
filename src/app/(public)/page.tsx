import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, Store, Tag, ArrowRight } from 'lucide-react';

async function getFeaturedContent() {
  try {
    // Use relative URL for server-side fetches to avoid SSL/DNS issues
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const apiUrl = baseUrl.startsWith('http') 
      ? `${baseUrl}/api/public/featured`
      : `https://${baseUrl}/api/public/featured`;
    
    const res = await fetch(apiUrl, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.error('Featured content fetch failed:', res.status, res.statusText);
      return { featuredCoupons: [], trendingStores: [], categories: [] };
    }

    const data = await res.json();
    return data.data || { featuredCoupons: [], trendingStores: [], categories: [] };
  } catch (error) {
    console.error('Error fetching featured content:', error);
    // Return empty data instead of crashing
    return { featuredCoupons: [], trendingStores: [], categories: [] };
  }
}

export default async function HomePage() {
  const { featuredCoupons, trendingStores, categories } = await getFeaturedContent();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Discover Amazing Deals
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Find the best coupons and discounts from local stores in your area
            </p>
            
            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-lg p-2 flex gap-2">
              <input
                type="text"
                placeholder="Search for coupons, stores, or categories..."
                className="flex-1 px-4 py-3 text-gray-900 focus:outline-none rounded"
              />
              <Link href="/coupons">
                <Button size="lg" className="px-8">
                  <Search className="h-5 w-5 mr-2" />
                  Search
                </Button>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-12">
              <div className="text-center">
                <div className="text-3xl font-bold">{featuredCoupons.length}+</div>
                <div className="text-sm opacity-90">Active Coupons</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{trendingStores.length}+</div>
                <div className="text-sm opacity-90">Stores</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{categories.length}+</div>
                <div className="text-sm opacity-90">Categories</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Browse Categories</h2>
            <Link href="/coupons" className="text-primary hover:underline">
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((category: any) => (
              <Link key={category.id} href={`/coupons?category=${category.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-2">{category.icon || '📦'}</div>
                    <h3 className="font-semibold text-sm">{category.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {category._count.coupons} coupons
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Coupons */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold">Featured Coupons</h2>
            </div>
            <Link href="/coupons">
              <Button variant="outline">
                View All Coupons
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCoupons.map((coupon: any) => (
              <Link key={coupon.id} href={`/coupons/${coupon.slug}`}>
                <Card className="hover:shadow-xl transition-shadow h-full cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="default" className="text-lg font-bold">
                        {coupon.type === 'PERCENTAGE'
                          ? `${coupon.discountValue}% OFF`
                          : `$${coupon.discountValue} OFF`}
                      </Badge>
                      {coupon._count.favorites > 0 && (
                        <span className="text-xs text-muted-foreground">
                          ❤️ {coupon._count.favorites}
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-lg line-clamp-2">
                      {coupon.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <Store className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">{coupon.store.name}</span>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <div className="text-xs text-muted-foreground mb-1">Coupon Code</div>
                        <div className="font-mono font-bold text-lg">{coupon.code}</div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {coupon._count.usages} uses
                        </span>
                        <span className="text-muted-foreground">
                          Expires: {new Date(coupon.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Stores */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Store className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold">Trending Stores</h2>
            </div>
            <Link href="/stores">
              <Button variant="outline">
                View All Stores
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingStores.map((store: any) => (
              <Link key={store.id} href={`/stores/${store.slug}`}>
                <Card className="hover:shadow-xl transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="w-16 h-16 bg-muted rounded-lg mb-3 flex items-center justify-center">
                      {store.logo ? (
                        <img src={store.logo} alt={store.name} className="rounded-lg" />
                      ) : (
                        <Store className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <CardTitle className="text-xl">{store.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Tag className="h-4 w-4" />
                        <span>{store._count.coupons} active coupons</span>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {store.categories.slice(0, 2).map((cat: any) => (
                          <Badge key={cat.name} variant="secondary" className="text-xs">
                            {cat.icon} {cat.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Save Money?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of smart shoppers finding the best deals every day
          </p>
          <Link href="/coupons">
            <Button size="lg" variant="secondary" className="px-8">
              Start Browsing Coupons
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
