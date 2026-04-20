import * as React from 'react';
import { CreditCard, DollarSign, Receipt, Clock, CheckCircle2, Search, Filter, ArrowUpRight, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Billing() {
  const [bills, setBills] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const q = query(collection(db, 'bills'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBills(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
        console.error("Bills fetch error:", error);
    });
    return () => unsubscribe();
  }, []);

  const totalOutstanding = bills
    .filter(b => b.status === 'unpaid' || b.status === 'Unpaid')
    .reduce((sum, b) => sum + (Number(b.total) || 0), 0);

  const monthlyRevenue = bills
    .filter(b => b.status === 'paid' || b.status === 'Paid')
    .reduce((sum, b) => sum + (Number(b.total) || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Billing & Payments</h2>
          <p className="text-slate-500 mt-1">Manage invoices, insurance, and transactions.</p>
        </div>
        <div className="flex gap-4">
           <Button className="bg-blue-600">
             <Receipt className="w-4 h-4 mr-2" />
             Generate New Invoice
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-slate-500 uppercase">Total Outstanding</p>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-slate-900">${totalOutstanding.toLocaleString()}</h3>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <span className="text-red-500 font-bold">{bills.filter(b => b.status === 'unpaid').length}</span> pending invoices
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-slate-500 uppercase">Collected (Revenue)</p>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-slate-900">${monthlyRevenue.toLocaleString()}</h3>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span className="text-emerald-500 font-bold">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-slate-900 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-slate-400 uppercase">Quick Action</p>
              <ArrowUpRight className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-sm font-medium mb-4">Complete insurance claim batch processing for today.</p>
            <Button size="sm" className="w-full bg-white/10 hover:bg-white/20 border-white/20 text-white">
              Process Batch
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle>Invoice History</CardTitle>
            <CardDescription>View and manage all patient transactions.</CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search invoice or patient..." className="pl-9 h-9" />
            </div>
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead>Invoice #</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issued Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-400">Loading invoices...</TableCell>
                </TableRow>
              ) : bills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-400 italic">No invoices found.</TableCell>
                </TableRow>
              ) : bills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell className="font-bold text-slate-900 uppercase">INV-{bill.id.slice(-6)}</TableCell>
                  <TableCell className="font-bold">${Number(bill.total).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge 
                      className={cn(
                        "font-medium",
                        (bill.status === 'paid' || bill.status === 'Paid') ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" : "bg-amber-50 text-amber-700 hover:bg-amber-50",
                      )}
                    >
                      {bill.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {bill.createdAt?.seconds ? format(new Date(bill.createdAt.seconds * 1000), 'MMM dd, hh:mm a') : '...'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-blue-600">Review</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
