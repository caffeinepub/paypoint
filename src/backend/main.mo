import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Array "mo:core/Array";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Types
  type Transaction = {
    sender : Principal;
    recipient : Principal;
    amount : Nat;
    timestamp : Time.Time;
  };

  module Transaction {
    public func compareByAmount(transaction1 : Transaction, transaction2 : Transaction) : Order.Order {
      Nat.compare(transaction1.amount, transaction2.amount);
    };
    public func compareBySender(transaction1 : Transaction, transaction2 : Transaction) : Order.Order {
      Principal.compare(transaction1.sender, transaction2.sender);
    };
    public func compareByRecipient(transaction1 : Transaction, transaction2 : Transaction) : Order.Order {
      Principal.compare(transaction1.recipient, transaction2.recipient);
    };
  };

  type User = {
    displayName : Text;
    balance : Nat;
    transactions : [Transaction];
  };

  module User {
    public func compare(user1 : User, user2 : User) : Order.Order {
      Text.compare(user1.displayName, user2.displayName);
    };
    public func compareByBalance(user1 : User, user2 : User) : Order.Order {
      Nat.compare(user1.balance, user2.balance);
    };
  };

  public type UserProfile = { name : Text };

  // State
  let users = Map.empty<Principal, User>();
  let transactions = Map.empty<Text, Transaction>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Helper Functions
  func getUserInternal(caller : Principal) : User {
    switch (users.get(caller)) {
      case (?user) { user };
      case (null) { Runtime.trap("User not found") };
    };
  };

  // Profile Operations (Required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // User Operations
  public shared ({ caller }) func registerUser(displayName : Text) : async () {
    if (users.containsKey(caller)) { Runtime.trap("User already registered") };
    let isFirstUser = users.size() == 0;
    let newUser = {
      displayName;
      balance = 0;
      transactions = [];
    };
    users.add(caller, newUser);

    if (isFirstUser) {
      // First user becomes admin - directly set role in state map
      accessControlState.userRoles.add(caller, #admin);
      accessControlState.adminAssigned := true;
    } else {
      // All other users get the user role - directly set role in state map
      accessControlState.userRoles.add(caller, #user);
    };
  };

  public query ({ caller }) func getBalance() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view balance");
    };
    let user = getUserInternal(caller);
    user.balance;
  };

  public query ({ caller }) func isRegistered() : async Bool {
    users.containsKey(caller);
  };

  // Transaction Operations
  public query ({ caller }) func getTransactions() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transactions");
    };
    let user = getUserInternal(caller);
    user.transactions;
  };

  public query ({ caller }) func getAllTransactions() : async [Transaction] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all transactions");
    };
    transactions.values().toArray();
  };

  public query ({ caller }) func getAllTransactionsBySender() : async [Transaction] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all transactions");
    };
    transactions.values().toArray().sort(Transaction.compareBySender);
  };

  public query ({ caller }) func getAllTransactionsByRecipient() : async [Transaction] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all transactions");
    };
    transactions.values().toArray().sort(Transaction.compareByRecipient);
  };

  public query ({ caller }) func getAllTransactionsByAmount() : async [Transaction] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all transactions");
    };
    transactions.values().toArray().sort(Transaction.compareByAmount);
  };

  public shared ({ caller }) func sendPoints(recipient : Principal, amount : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send points");
    };
    let senderUser = getUserInternal(caller);
    if (senderUser.balance < amount) {
      Runtime.trap("Insufficient balance");
    };
    let recipientUser = switch (users.get(recipient)) {
      case (?user) { user };
      case (null) { Runtime.trap("Recipient not found") };
    };
    let transaction = {
      sender = caller;
      recipient;
      amount;
      timestamp = Time.now();
    };
    let updatedSender = {
      senderUser with
      balance = senderUser.balance - amount;
      transactions = senderUser.transactions.concat([transaction]);
    };
    let updatedRecipient = {
      recipientUser with
      balance = recipientUser.balance + amount;
      transactions = recipientUser.transactions.concat([transaction]);
    };
    users.add(caller, updatedSender);
    users.add(recipient, updatedRecipient);
    // Record transaction
    let transactionId = senderUser.displayName # "_to_" # recipientUser.displayName # Time.now().toText();
    transactions.add(transactionId, transaction);
  };

  // Admin Operations
  public shared ({ caller }) func allocatePoints(user : Principal, amount : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can allocate points");
    };
    let targetUser = switch (users.get(user)) {
      case (?user) { user };
      case (null) { Runtime.trap("User not found") };
    };
    let allocatedUser = {
      targetUser with
      balance = targetUser.balance + amount;
    };
    users.add(user, allocatedUser);
  };

  public query ({ caller }) func getAllUsers() : async [User] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };
    users.values().toArray().sort();
  };

  public query ({ caller }) func getAllUsersByDisplayName() : async [User] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };
    users.values().toArray().sort();
  };

  public query ({ caller }) func getAllUsersByBalance() : async [User] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };
    users.values().toArray().sort(User.compareByBalance);
  };
};
