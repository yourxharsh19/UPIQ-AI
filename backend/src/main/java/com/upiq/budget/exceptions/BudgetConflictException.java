package com.upiq.budget.exceptions;

public class BudgetConflictException extends RuntimeException {
    public BudgetConflictException() {
        super("A budget already exists for this category and month");
    }
}
