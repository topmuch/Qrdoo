'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileDown, Eye, PackageOpen, Loader2 } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Batch {
  id: string;
  quantity: number;
  designConfig: string | null;
  createdAt: string;
  physicalQrCodes: {
    id: string;
    status: string;
  }[];
}

function parseColorFromDesignConfig(designConfig: string | null): string | null {
  if (!designConfig) return null;
  try {
    const config = JSON.parse(designConfig);
    return config.primaryColor || config.color || config.backgroundColor || null;
  } catch {
    return null;
  }
}

function getBatchStats(batch: Batch) {
  const total = batch.physicalQrCodes.length;
  const activated = batch.physicalQrCodes.filter(
    (qr) => qr.status === 'ACTIVE'
  ).length;
  return { total, activated };
}

function StatusBadge({ activated, total }: { activated: number; total: number }) {
  const allActivated = activated === total && total > 0;
  const noneActivated = activated === 0;
  const inProgress = !allActivated && !noneActivated;

  if (noneActivated) {
    return (
      <Badge variant="secondary">
        {activated}/{total} activés
      </Badge>
    );
  }
  if (allActivated) {
    return (
      <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">
        {activated}/{total} activés
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-amber-500 text-amber-700">
      {activated}/{total} activés
    </Badge>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  );
}

export function ManageBatches() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBatches() {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/batches');
        if (!res.ok) throw new Error('Erreur lors du chargement des lots');
        const data = await res.json();
        setBatches(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    }
    fetchBatches();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion des lots</CardTitle>
        <CardDescription>
          Liste de tous les lots de QR codes physiques générés
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && <TableSkeleton />}

        {error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {!loading && !error && batches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <PackageOpen className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">Aucun lot</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Aucun lot de QR codes n&apos;a été créé pour le moment.
            </p>
          </div>
        )}

        {!loading && !error && batches.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead className="text-center">Quantité</TableHead>
                  <TableHead>Design</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => {
                  const { total, activated } = getBatchStats(batch);
                  const color = parseColorFromDesignConfig(batch.designConfig);
                  return (
                    <TableRow key={batch.id}>
                      <TableCell className="font-mono text-xs">
                        {batch.id.slice(0, 8)}…
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {batch.quantity}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {color ? (
                            <span
                              className="inline-block h-6 w-6 rounded-full border border-border"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ) : (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 text-[10px] text-muted-foreground">
                              N/A
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(batch.createdAt), 'dd MMM yyyy', {
                          locale: fr,
                        })}
                      </TableCell>
                      <TableCell>
                        <StatusBadge activated={activated} total={total} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" title="Télécharger PDF">
                            <FileDown className="h-4 w-4" />
                            <span className="sr-only">Télécharger PDF</span>
                          </Button>
                          <Button variant="ghost" size="sm" title="Voir les détails">
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Voir les détails</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
