package com.upiq.budget.exceptions;

public class BudgetNotFoundException extends RuntimeException {
    public BudgetNotFoundException() {
        super("Budget not found");
    }
}
