<?php
namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\{Fee, Student, ClassRoom};
use App\Http\Requests\School\StoreFeeRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\{Inertia, Response};

class FeeController extends Controller
{
    public function index(Request $request): Response
    {
        $fees = Fee::with(['student.user','student.classRoom'])
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->class_room_id, fn ($q, $id) => $q->whereHas('student', fn ($sq) => $sq->where('class_room_id', $id)))
            ->when($request->search, fn ($q, $s) => $q->whereHas('student.user', fn ($uq) => $uq->where('name', 'like', "%{$s}%")))
            ->latest()->paginate(30)->withQueryString();

        $summary = [
            'total_assigned' => Fee::sum('amount'),
            'total_collected'=> Fee::where('status','paid')->sum('amount'),
            'total_pending'  => Fee::whereIn('status',['pending','partial','overdue'])->sum('amount'),
        ];

        return Inertia::render('SchoolAdmin/Fees', [
            'fees'       => $fees,
            'summary'    => $summary,
            'classrooms' => ClassRoom::orderBy('name')->get(['id','name']),
            'filters'    => $request->only('status','class_room_id','search'),
        ]);
    }

    public function store(StoreFeeRequest $request)
    {
        $tenant = app('currentTenant');
        $data   = $request->validated();

        DB::transaction(function () use ($data, $tenant) {
            $students = match($data['assignment_type']) {
                'all'        => Student::where('status','active')->get(),
                'class'      => Student::where('class_room_id', $data['class_room_id'])->where('status','active')->get(),
                'individual' => Student::where('id', $data['student_id'])->get(),
            };

            foreach ($students as $student) {
                Fee::create([
                    'tenant_id'  => $tenant->id,
                    'student_id' => $student->id,
                    'title'      => $data['title'],
                    'term'       => $data['term'],
                    'amount'     => $data['amount'],
                    'due_date'   => $data['due_date'],
                    'status'     => 'pending',
                ]);
            }
        });

        return redirect()->route('admin.fees.index')->with('success', 'Fee assigned successfully.');
    }

    public function destroy(Fee $fee)
    {
        abort_if($fee->isPaid(), 422, 'Cannot delete a paid fee.');
        $fee->delete();
        return back()->with('success', 'Fee removed.');
    }

    public function bulkAssignPortalFee(Request $request)
    {
        $tenant = app('currentTenant');
        if ($tenant->billing_payer !== 'student') {
            return back()->with('error', 'Portal fees are paid by the school. Students are not billed directly.');
        }

        $feeAmount = $tenant->billing_amount;

        $students = Student::where('status', 'active')->get();
        $count = 0;

        DB::transaction(function () use ($students, $tenant, $feeAmount, &$count) {
            foreach ($students as $student) {
                // Check if already assigned
                $exists = Fee::where('student_id', $student->id)
                    ->where('title', 'Platform Access Fee')
                    ->where('term', now()->format('Y-m'))
                    ->exists();

                if (!$exists) {
                    Fee::create([
                        'tenant_id'  => $tenant->id,
                        'student_id' => $student->id,
                        'title'      => 'Platform Access Fee',
                        'term'       => now()->format('Y-m'),
                        'amount'     => $feeAmount,
                        'due_date'   => now()->addDays(14)->toDateString(),
                        'status'     => 'pending',
                    ]);
                    $count++;
                }
            }
        });

        return back()->with('success', "Assigned Platform Access Fee to {$count} active students.");
    }
}
