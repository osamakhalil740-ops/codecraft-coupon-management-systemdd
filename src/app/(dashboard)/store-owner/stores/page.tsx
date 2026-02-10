'use client';

import { useEffect, useState } from 'react';
import { StoreStatus } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Store = {
  id: string;
  name: string;
  description: string;
  status: StoreStatus;
  createdAt: string;
  country: {
    name: string;
  };
  city?: {
    name: string;
  };
  _count: {
    coupons: number;
    reviews: number;
  };
};

export default function StoreOwnerStoresPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStores();
  }, []);

  async function fetchStores() {
    setLoading(true);
    try {
      const res = await fetch('/api/store-owner/stores');
      const data = await res.json();
      setStores(data.data || []);
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: StoreStatus) {
    const variants: Record<StoreStatus, any> = {
      PENDING: 'warning',
      APPROVED: 'success',
      REJECTED: 'destructive',
      SUSPENDED: 'destructive',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">My Stores</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : stores.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No stores yet</p>
            <Button onClick={() => router.push('/store-owner/stores/create')}>Create Your First Store</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <Card key={store.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{store.name}</CardTitle>
                  {getStatusBadge(store.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {store.description || 'No description'}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">
                      {store.city?.name}, {store.country.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Coupons:</span>
                    <span className="font-medium">{store._count.coupons}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reviews:</span>
                    <span className="font-medium">{store._count.reviews}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => router.push(`/store-owner/stores/${store.id}/edit`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Store
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
