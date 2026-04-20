import * as React from 'react';
import { Users, Search, Plus, UserPlus, Filter, MoreVertical, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Patients() {
  const [patients, setPatients] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    const q = query(collection(db, 'patients'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPatients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
        console.error("Patients fetch error:", error);
    });
    return () => unsubscribe();
  }, []);

  const filteredPatients = patients.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.contact?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Patient Directory</h2>
          <p className="text-slate-500 mt-1">Total {patients.length} patients registered.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-10">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 h-10 px-6">
            <Plus className="w-4 h-4 mr-2" />
            New Patient
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search by name, ID or phone number..." 
              className="pl-9 bg-white border-slate-200" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Patient Name</TableHead>
              <TableHead>Age / Gender</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Joined Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-slate-400">Loading patients...</TableCell>
              </TableRow>
            ) : filteredPatients.map((patient) => (
              <TableRow key={patient.id} className="group hover:bg-slate-50/50 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9 border border-slate-200 shadow-sm">
                      <AvatarImage src={`https://picsum.photos/seed/${patient.name}/200`} />
                      <AvatarFallback>{patient.name?.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{patient.name}</p>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">ID: {patient.id.slice(-6)}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-slate-600 font-medium whitespace-nowrap">
                  {patient.dob ? Number(format(new Date(), 'yyyy')) - Number(format(new Date(patient.dob), 'yyyy')) : '??'}y • {patient.gender || 'Other'}
                </TableCell>
                <TableCell className="text-slate-600 font-medium">{patient.contact}</TableCell>
                <TableCell className="text-slate-500">
                  {patient.createdAt?.seconds ? format(new Date(patient.createdAt.seconds * 1000), 'MMM dd, yyyy') : '...'}
                </TableCell>
                <TableCell>
                  <Badge 
                    className={cn(
                      "font-medium",
                       "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                    )}
                  >
                    Active
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem className="flex items-center gap-2 py-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        View Medical Records
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2 py-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        Book Appointment
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="flex items-center gap-2 py-2 text-red-600 focus:text-red-700">
                        Archive Patient
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!loading && filteredPatients.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-slate-400 italic">No patients found matching your search.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
