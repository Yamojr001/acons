<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add email and payer_name to transactions table
        if (Schema::hasTable('transactions')) {
            Schema::table('transactions', function (Blueprint $table) {
                if (!Schema::hasColumn('transactions', 'email')) {
                    $table->string('email')->nullable()->after('user_id');
                }
                if (!Schema::hasColumn('transactions', 'payer_name')) {
                    $table->string('payer_name')->nullable()->after('email');
                }
            });
        }

        // 2. Add email and payer_name to payments table
        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table) {
                if (!Schema::hasColumn('payments', 'email')) {
                    $table->string('email')->nullable()->after('student_invoice_id');
                }
                if (!Schema::hasColumn('payments', 'payer_name')) {
                    $table->string('payer_name')->nullable()->after('email');
                }
            });
        }

        // 3. Backfill email and payer_name on transactions
        if (Schema::hasTable('transactions') && Schema::hasTable('applicants')) {
            $applicantTxs = DB::table('transactions')
                ->where('payable_type', 'like', '%Applicant%')
                ->whereNull('email')
                ->get();

            foreach ($applicantTxs as $tx) {
                $applicant = DB::table('applicants')->where('id', $tx->payable_id)->first();
                if ($applicant) {
                    $name = trim(($applicant->first_name ?? '') . ' ' . ($applicant->middle_name ?? '') . ' ' . ($applicant->last_name ?? ''));
                    DB::table('transactions')->where('id', $tx->id)->update([
                        'email'      => $applicant->email,
                        'payer_name' => $name ?: ($applicant->email ?? null),
                    ]);
                }
            }
        }

        // 4. Backfill email and payer_name on payments table
        if (Schema::hasTable('payments')) {
            $allPayments = DB::table('payments')->whereNull('email')->get();
            foreach ($allPayments as $p) {
                $email = null;
                $payerName = null;

                // If linked to student_invoice
                if ($p->student_invoice_id && Schema::hasTable('student_invoices')) {
                    $invoice = DB::table('student_invoices')->where('id', $p->student_invoice_id)->first();
                    if ($invoice && Schema::hasTable('students') && Schema::hasTable('users')) {
                        $student = DB::table('students')->where('id', $invoice->student_id)->first();
                        if ($student) {
                            $user = DB::table('users')->where('id', $student->user_id)->first();
                            if ($user) {
                                $email = $user->email;
                                $payerName = $user->name;
                            }
                        }
                    }
                }

                // If admission fee reference
                if (!$email && str_starts_with($p->reference ?? '', 'ACON_ADM_') && Schema::hasTable('applicants')) {
                    $applicant = DB::table('applicants')->where('payment_reference', $p->reference)->first();
                    if ($applicant) {
                        $email = $applicant->email;
                        $payerName = trim(($applicant->first_name ?? '') . ' ' . ($applicant->last_name ?? ''));
                    }
                }

                if ($email || $payerName) {
                    DB::table('payments')->where('id', $p->id)->update([
                        'email'      => $email,
                        'payer_name' => $payerName,
                    ]);
                }
            }
        }

        // 5. Cross-sync student payments from `payments` into `transactions` table
        // so that transactions acts as a unified ledger for both applicants and students
        if (Schema::hasTable('payments') && Schema::hasTable('transactions')) {
            $studentPayments = DB::table('payments')
                ->whereNotNull('student_invoice_id')
                ->get();

            foreach ($studentPayments as $sp) {
                $exists = DB::table('transactions')->where('reference', $sp->reference)->first();
                if (!$exists) {
                    $feeType = 'school_fees';
                    $userId = null;

                    if (Schema::hasTable('student_invoices')) {
                        $inv = DB::table('student_invoices')->where('id', $sp->student_invoice_id)->first();
                        if ($inv && Schema::hasTable('fees')) {
                            $fee = DB::table('fees')->where('id', $inv->fee_id)->first();
                            if ($fee) {
                                $feeType = $fee->fee_type;
                            }
                        }
                        if ($inv && Schema::hasTable('students')) {
                            $std = DB::table('students')->where('id', $inv->student_id)->first();
                            if ($std) {
                                $userId = $std->user_id;
                            }
                        }
                    }

                    DB::table('transactions')->insert([
                        'user_id'        => $userId,
                        'email'          => $sp->email,
                        'payer_name'     => $sp->payer_name,
                        'payable_type'   => 'App\Models\StudentInvoice',
                        'payable_id'     => $sp->student_invoice_id,
                        'type'           => $feeType,
                        'amount'         => $sp->amount,
                        'currency'       => 'NGN',
                        'status'         => $sp->status,
                        'payment_method' => $sp->payment_gateway,
                        'reference'      => $sp->reference,
                        'metadata'       => $sp->metadata,
                        'created_at'     => $sp->created_at,
                        'updated_at'     => $sp->updated_at,
                    ]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('transactions')) {
            Schema::table('transactions', function (Blueprint $table) {
                if (Schema::hasColumn('transactions', 'email')) {
                    $table->dropColumn('email');
                }
                if (Schema::hasColumn('transactions', 'payer_name')) {
                    $table->dropColumn('payer_name');
                }
            });
        }

        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table) {
                if (Schema::hasColumn('payments', 'email')) {
                    $table->dropColumn('email');
                }
                if (Schema::hasColumn('payments', 'payer_name')) {
                    $table->dropColumn('payer_name');
                }
            });
        }
    }
};
