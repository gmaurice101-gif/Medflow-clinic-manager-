import * as React from 'react';
import { CreditCard, DollarSign, Receipt, Clock, CheckCircle2, Search, Filter, ArrowUpRight, TrendingUp, Printer, Eye, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { db, auth } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Printable Receipt Component
const ReceiptDocument = React.forwardRef<HTMLDivElement, { bill: any }>(({ bill }, ref) => {
  if (!bill) return null;

  return (
    <div ref={ref} className="p-12 text-slate-900 bg-white min-h-[148mm] font-sans">
      <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter italic">Medflow Clinic Manager</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Official Payment Record</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-xl uppercase">INV-{bill.id.slice(-6)}</p>
          <p className="text-xs text-slate-500 font-medium">Date: {bill.createdAt?.seconds ? format(new Date(bill.createdAt.seconds * 1000), 'dd MMM yyyy') : format(new Date(), 'dd MMM yyyy')}</p>
        </div>
      </div>

      <div className="mb-10 flex justify-between items-start">
        <div>
          <h2 className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Patient Details</h2>
          <p className="text-xl font-bold uppercase">{bill.patientName || 'N/A'}</p>
          <p className="text-sm text-slate-600 font-medium">ID: {bill.patientId}</p>
        </div>
        <div className="text-right">
          <h2 className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Facility Details</h2>
          <p className="text-md font-bold uppercase">Medflow Clinic Manager</p>
          <p className="text-xs text-slate-500">Nairobi, Kenya</p>
        </div>
      </div>

      <div className="mb-10">
        <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Billing Breakdown</h3>
        <table className="w-full text-left">
          <thead>
            <tr className="border-y border-slate-200">
              <th className="py-2 text-[10px] font-black uppercase">Description</th>
              <th className="py-2 text-[10px] font-black uppercase text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {bill.items?.map((item: any, i: number) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-3 text-sm font-medium">{item.name}</td>
                <td className="py-3 text-sm font-bold text-right">KSh {Number(item.price).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="pt-6 text-sm font-black uppercase">Total Payable</td>
              <td className="pt-6 text-xl font-black text-right">KSh {Number(bill.total).toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-12 flex justify-between items-end border-t border-slate-100 pt-6">
        <div>
          <Badge className={cn(
            "text-[10px] font-black uppercase px-3 py-1",
            (bill.status === 'paid' || bill.status === 'Paid') ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700 font-black"
          )}>
            Payment Status: {bill.status}
          </Badge>
        </div>
        <div className="text-right">
          <div className="w-32 h-px bg-slate-950 mb-2 ml-auto opacity-20" />
          <p className="text-[9px] font-black uppercase tracking-tighter italic opacity-40">Cashier Signature</p>
        </div>
      </div>
    </div>
  );
});

ReceiptDocument.displayName = 'ReceiptDocument';

export default function Billing() {
  const [bills, setBills] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedBill, setSelectedBill] = React.useState<any | null>(null);

  const isAdmin = auth.currentUser?.email === 'gmaurice@gmail.com' || auth.currentUser?.email === 'gmaurice101@gmail.com';

  const receiptRef = React.useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
  });

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            if (el.style) {
              // Replace oklch colors with fallback grayscale if they exist in inline styles
              // but mostly html2canvas fails on computed styles. 
              // This is a common workaround for html2canvas + oklch
              const computedStyle = window.getComputedStyle(el);
              if (computedStyle.color?.includes('oklch')) el.style.color = '#000000';
              if (computedStyle.backgroundColor?.includes('oklch')) el.style.backgroundColor = 'transparent';
              if (computedStyle.borderColor?.includes('oklch')) el.style.borderColor = '#000000';
            }
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Receipt-${selectedBill?.id.slice(-6)}.pdf`);
      toast.success("PDF saved successfully");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    }
  };

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

  const handleMarkAsPaid = async (billId: string) => {
    try {
      await updateDoc(doc(db, 'bills', billId), {
        status: 'paid',
        paidAt: serverTimestamp()
      });
      toast.success("Payment confirmed and invoice closed.");
      setSelectedBill(prev => prev ? { ...prev, status: 'paid' } : null);
    } catch (error) {
      toast.error("Failed to update payment status.");
    }
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Billing & Payments</h2>
          <p className="text-slate-500 mt-2 font-medium">Manage invoices, insurance, and transactions.</p>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
           <Button className="bg-black text-white hover:bg-slate-800 rounded-none w-full sm:w-auto px-8 h-12 uppercase text-[10px] font-black tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
             <Receipt className="w-4 h-4 mr-2" />
             Batch Processing
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
            <h3 className="text-3xl font-extrabold text-slate-900">KSh {totalOutstanding.toLocaleString()}</h3>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <span className="text-red-500 font-bold">{bills.filter(b => b.status === 'unpaid').length}</span> pending invoices
            </p>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-slate-500 uppercase">Collected (Revenue)</p>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900">KSh {monthlyRevenue.toLocaleString()}</h3>
              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-500 font-bold">+12%</span> from last month
              </p>
            </CardContent>
          </Card>
        )}

        <Card className={cn(
          "border-slate-200 shadow-sm bg-slate-900 text-white",
          !isAdmin && "col-span-2"
        )}>
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
        <CardContent className="overflow-x-auto">
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
                  <TableCell className="font-bold">KSh {Number(bill.total).toLocaleString()}</TableCell>
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
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600 font-bold hover:bg-blue-50"
                        onClick={() => setSelectedBill(bill)}
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bill/Receipt Detailed Viewer */}
      <Dialog open={!!selectedBill} onOpenChange={(open) => !open && setSelectedBill(null)}>
        <DialogContent className="max-w-[700px] w-[95vw] h-[85vh] flex flex-col p-0 border-none overflow-hidden rounded-2xl shadow-2xl">
          <DialogHeader className="p-4 bg-slate-900 text-white flex flex-row items-center justify-between shrink-0">
            <DialogTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Invoice Viewer</DialogTitle>
            <div className="flex items-center gap-2">
                {(selectedBill?.status === 'unpaid' || selectedBill?.status === 'Unpaid') && (
                    <Button 
                        size="sm" 
                        className="bg-emerald-600 hover:bg-emerald-700 h-8 font-black uppercase text-[10px]"
                        onClick={() => handleMarkAsPaid(selectedBill.id)}
                    >
                        Confirm Payment
                    </Button>
                )}
                <Button 
                    size="sm" 
                    variant="outline"
                    className="bg-white/10 hover:bg-white/20 border-white/20 text-white h-8 font-black uppercase text-[10px]" 
                    onClick={handleDownloadPDF}
                >
                    <Download className="w-3 h-3 mr-2" /> Save PDF
                </Button>
                <Button 
                    size="sm" 
                    variant="outline"
                    className="bg-white/10 hover:bg-white/20 border-white/20 text-white h-8 font-black uppercase text-[10px]" 
                    onClick={handlePrint}
                >
                    <Printer className="w-3 h-3 mr-2" /> Print Receipt
                </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto bg-slate-100 p-8">
            <div className="flex justify-center">
              <div className="bg-white shadow-xl min-w-[500px]">
                <ReceiptDocument ref={receiptRef} bill={selectedBill} />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
