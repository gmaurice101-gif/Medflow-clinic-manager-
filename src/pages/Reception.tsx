import * as React from 'react';
import { Plus, Search, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp, orderBy, where, doc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError } from '@/lib/error-handler';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Reception() {
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [appointments, setAppointments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // Registration form state
  const [newName, setNewName] = React.useState('');
  const [newPhone, setNewPhone] = React.useState('');
  const [newDob, setNewDob] = React.useState('');

  React.useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const q = query(
      collection(db, 'appointments'), 
      where('date', '==', today),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAppointments(apts);
      setLoading(false);
    }, (error) => {
      console.error("Snapshot error:", error);
      toast.error("Failed to load appointments");
    });

    return () => unsubscribe();
  }, []);

  const handleRegister = async () => {
    if (!newName || !newPhone) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      // 1. Create Patient
      const patientRef = await addDoc(collection(db, 'patients'), {
        name: newName,
        contact: newPhone,
        dob: newDob,
        createdAt: serverTimestamp(),
      });

      // 2. Create Appointment for today automatically
      await addDoc(collection(db, 'appointments'), {
        patientId: patientRef.id,
        patientName: newName,
        date: format(new Date(), 'yyyy-MM-dd'),
        status: 'Scheduled',
        createdAt: serverTimestamp(),
      });

      toast.success("Patient registered and appointment created");
      setIsRegistering(false);
      setNewName('');
      setNewPhone('');
      setNewDob('');
    } catch (error) {
      handleFirestoreError(error, 'create', 'patients/appointments');
    }
  };

  const handleCheckIn = async (appointmentId: string) => {
    try {
      const aptRef = doc(db, 'appointments', appointmentId);
      await updateDoc(aptRef, {
        status: 'Checked In',
        updatedAt: serverTimestamp()
      });
      toast.success("Patient checked in");
    } catch (error) {
      handleFirestoreError(error, 'update', `appointments/${appointmentId}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Reception</h2>
          <p className="text-slate-500">Manage patient arrivals and registration for {format(new Date(), 'MMMM do, yyyy')}.</p>
        </div>
        <Dialog open={isRegistering} onOpenChange={setIsRegistering}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Register New Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Register Patient</DialogTitle>
              <DialogDescription>
                Enter the patient details to create a new record and daily appointment.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input 
                  id="name" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">Phone</Label>
                <Input 
                  id="phone" 
                  value={newPhone} 
                  onChange={(e) => setNewPhone(e.target.value)} 
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dob" className="text-right">DOB</Label>
                <Input 
                  id="dob" 
                  type="date" 
                  value={newDob} 
                  onChange={(e) => setNewDob(e.target.value)} 
                  className="col-span-3" 
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsRegistering(false)}>Cancel</Button>
              <Button onClick={handleRegister}>Create Record</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-semibold text-slate-900">Today's Queue</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search today's patients..." className="pl-9 bg-white" />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Patient Name</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-400 italic">
                  Loading appointments...
                </TableCell>
              </TableRow>
            ) : appointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-400 italic">
                  No appointments registered for today.
                </TableCell>
              </TableRow>
            ) : (
              appointments.map((apt) => (
                <TableRow key={apt.id}>
                  <TableCell className="font-medium">
                    {apt.createdAt?.seconds ? format(new Date(apt.createdAt.seconds * 1000), 'hh:mm a') : '...'}
                  </TableCell>
                  <TableCell>{apt.patientName}</TableCell>
                  <TableCell>{apt.doctorName || 'Not Assigned'}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        apt.status === 'Checked In' ? 'default' : 
                        apt.status === 'Waiting' ? 'secondary' : 
                        'outline'
                      }
                      className={cn(
                        apt.status === 'Checked In' && "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200",
                        apt.status === 'Waiting' && "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200"
                      )}
                    >
                      {apt.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {apt.status === 'Scheduled' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => handleCheckIn(apt.id)}
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        Check-in
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';

