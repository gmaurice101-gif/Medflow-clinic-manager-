import * as React from 'react';
import { ShieldCheck, UserPlus, Trash2, Mail, Briefcase, Plus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { db, auth } from '@/lib/firebase';
import { collection, query, onSnapshot, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

const DEPARTMENTS = [
  'Reception',
  'Consultation',
  'Pharmacy',
  'Laboratory',
  'Radiology',
  'Billing',
  'Management',
  'Admin'
];

export default function Admin() {
  const [users, setUsers] = React.useState<any[]>([]);
  const [email, setEmail] = React.useState('');
  const [selectedRoles, setSelectedRoles] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Hardcoded initial admin check
  const isAdmin = auth.currentUser?.email === 'gmaurice101@gmail.com' || auth.currentUser?.email === 'gmaurice@gmail.com';

  React.useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, 'staff'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleAddUser = async () => {
    if (!email || selectedRoles.length === 0) {
      toast.error("Please provide an email and at least one role.");
      return;
    }

    try {
      // We use email as ID for convenience in role checking
      await setDoc(doc(db, 'staff', email.toLowerCase()), {
        email: email.toLowerCase(),
        roles: selectedRoles,
        createdAt: new Date().toISOString()
      });
      toast.success("Staff member added successfully");
      setEmail('');
      setSelectedRoles([]);
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error("Failed to add user");
    }
  };

  const handleRemoveUser = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'staff', id));
      toast.success("Staff member removed");
    } catch (error) {
      toast.error("Failed to remove user");
    }
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-3xl font-black uppercase tracking-tighter">System Administration</h2>
        <p className="text-slate-500 mt-2 font-medium">Manage user access and departmental roles.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add User Form */}
        <Card className="lg:col-span-1 border-black border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              Provision New User
            </CardTitle>
            <CardDescription>Grant system access by email address.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input 
                  id="email"
                  placeholder="staff@medflow.com" 
                  className="pl-10 border-slate-200"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Departmental Access</Label>
              <div className="grid grid-cols-2 gap-3">
                {DEPARTMENTS.map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`role-${role}`} 
                      checked={selectedRoles.includes(role)}
                      onCheckedChange={() => toggleRole(role)}
                    />
                    <label 
                      htmlFor={`role-${role}`}
                      className="text-xs font-bold leading-none cursor-pointer"
                    >
                      {role}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleAddUser} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest h-12 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              Grant Access
            </Button>
          </CardContent>
        </Card>

        {/* User List */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Active Staff Directory
            </CardTitle>
            <CardDescription>View and manage permissions for all provisioned users.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Access Roles</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10 text-slate-400">Loading directory...</TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10 text-slate-400 italic">No users provisioned.</TableCell>
                  </TableRow>
                ) : users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs uppercase">
                          {u.email[0]}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{u.email}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-black">Provisioned</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roles?.map((role: string) => (
                          <Badge key={role} variant="outline" className="text-[9px] font-black uppercase tracking-tighter bg-slate-50">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRemoveUser(u.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
