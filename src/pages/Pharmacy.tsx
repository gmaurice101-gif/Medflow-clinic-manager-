import * as React from 'react';
import { Pill, Package, Search, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, where, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError } from '@/lib/error-handler';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Pharmacy() {
  const [prescriptions, setPrescriptions] = React.useState<any[]>([]);
  const [inventory, setInventory] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // 1. Listen for Pending Prescriptions
    const qPresc = query(
      collection(db, 'prescriptions'),
      where('status', '==', 'Pending'),
      orderBy('createdAt', 'desc')
    );
    const unsubPresc = onSnapshot(qPresc, (snap) => {
      setPrescriptions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
        console.error("Prescriptions snapshot error:", error);
    });

    // 2. Listen for Inventory
    const qInv = query(collection(db, 'inventory'), orderBy('name', 'asc'));
    const unsubInv = onSnapshot(qInv, (snap) => {
      setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (error) => {
        console.error("Inventory snapshot error:", error);
    });

    return () => {
      unsubPresc();
      unsubInv();
    };
  }, []);

  const handleDispense = async (prescription: any) => {
    try {
      // 1. Mark prescription as dispensed
      await updateDoc(doc(db, 'prescriptions', prescription.id), {
        status: 'Dispensed',
        dispensedAt: serverTimestamp()
      });

      toast.success(`Medication dispensed to patient`);
    } catch (error) {
      handleFirestoreError(error, 'update', `prescriptions/${prescription.id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Pharmacy</h2>
          <p className="text-slate-500">Manage prescriptions and medical inventory.</p>
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="bg-slate-100 p-1 rounded-xl mb-6">
          <TabsTrigger value="pending" className="data-[state=active]:bg-white rounded-lg">
            Pending Prescriptions
            {prescriptions.length > 0 && (
              <Badge className="ml-2 bg-blue-600">{prescriptions.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="inventory" className="data-[state=active]:bg-white rounded-lg">
            Inventory Tracking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prescriptions.map((presc) => (
              <Card key={presc.id} className="border-slate-200 overflow-hidden shadow-sm flex flex-col">
                <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold uppercase">
                      {presc.patientId.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">ID: {presc.patientId.slice(-6)}</p>
                      <p className="text-[10px] text-slate-400">
                        {presc.createdAt?.seconds ? format(new Date(presc.createdAt.seconds * 1000), 'hh:mm a') : '...'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Prescribed Meds</p>
                    <ul className="space-y-2">
                      {presc.medications?.map((med: any, i: number) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span className="font-medium">{med.name}</span>
                          <span className="text-slate-400">— {med.dosage}</span>
                        </li>
                      ))}
                    </ul>
                    {presc.instructions && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700 italic">
                        "{presc.instructions}"
                      </div>
                    )}
                  </div>
                  <div className="mt-6">
                    <Button 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 h-10" 
                      onClick={() => handleDispense(presc)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Dispense Medication
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {prescriptions.length === 0 && (
            <div className="py-20 text-center bg-slate-50 border-2 border-dashed rounded-2xl border-slate-200">
              <Pill className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900">No pending prescriptions</h3>
              <p className="text-slate-500">All meds have been dispensed for today.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="inventory">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="font-semibold">Stock Levels</h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input placeholder="Search drugs..." className="pl-9 bg-white w-64" />
                </div>
                <Button variant="outline">
                  <Package className="w-4 h-4 mr-2" /> Add Stock
                </Button>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medication Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Price (Unit)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-bold text-slate-900">{item.name}</TableCell>
                    <TableCell className="text-slate-500">{item.category || 'General'}</TableCell>
                    <TableCell>
                      <span className={item.stockLevel < 50 ? 'text-red-600 font-bold' : ''}>
                        {item.stockLevel} units
                      </span>
                    </TableCell>
                    <TableCell>${item.unitPrice?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>
                      {item.stockLevel < 50 ? (
                        <Badge className="bg-red-50 text-red-700 hover:bg-red-50 border-red-100">Low Stock</Badge>
                      ) : (
                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100">In Stock</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Adjust</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-slate-400">Loading inventory...</TableCell>
                  </TableRow>
                )}
                {!loading && inventory.length === 0 && (
                   <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-slate-400 italic">
                      Inventory is empty.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
