import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Transaction {
    recipient: Principal;
    sender: Principal;
    timestamp: Time;
    amount: bigint;
}
export type Time = bigint;
export interface UserProfile {
    name: string;
}
export interface User {
    balance: bigint;
    displayName: string;
    transactions: Array<Transaction>;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    allocatePoints(user: Principal, amount: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllTransactions(): Promise<Array<Transaction>>;
    getAllTransactionsByAmount(): Promise<Array<Transaction>>;
    getAllTransactionsByRecipient(): Promise<Array<Transaction>>;
    getAllTransactionsBySender(): Promise<Array<Transaction>>;
    getAllUsers(): Promise<Array<User>>;
    getAllUsersByBalance(): Promise<Array<User>>;
    getAllUsersByDisplayName(): Promise<Array<User>>;
    getBalance(): Promise<bigint>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getTransactions(): Promise<Array<Transaction>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isRegistered(): Promise<boolean>;
    registerUser(displayName: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendPoints(recipient: Principal, amount: bigint): Promise<void>;
}
