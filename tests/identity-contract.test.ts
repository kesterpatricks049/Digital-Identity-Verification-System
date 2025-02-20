import { describe, it, beforeEach, expect } from "vitest";

describe("Identity Contract", () => {
  let mockStorage: Map<string, any>;
  
  beforeEach(() => {
    mockStorage = new Map();
  });
  
  const mockContractCall = (method: string, args: any[], sender: string) => {
    switch (method) {
      case "create-identity":
        const [name, dateOfBirth, country] = args;
        if (mockStorage.has(sender)) {
          return { success: false, error: "ERR_ALREADY_EXISTS" };
        }
        mockStorage.set(sender, {
          name,
          "date-of-birth": dateOfBirth,
          country,
          "created-at": 100, // mock block height
          "updated-at": 100,
        });
        return { success: true };
      
      case "update-identity":
        const [updateName, updateDateOfBirth, updateCountry] = args;
        if (!mockStorage.has(sender)) {
          return { success: false, error: "ERR_NOT_FOUND" };
        }
        const existingIdentity = mockStorage.get(sender);
        mockStorage.set(sender, {
          ...existingIdentity,
          name: updateName,
          "date-of-birth": updateDateOfBirth,
          country: updateCountry,
          "updated-at": 101, // mock new block height
        });
        return { success: true };
      
      case "delete-identity":
        if (!mockStorage.has(sender)) {
          return { success: false, error: "ERR_NOT_FOUND" };
        }
        mockStorage.delete(sender);
        return { success: true };
      
      case "get-identity":
        return { success: true, value: mockStorage.get(args[0]) };
      
      case "identity-exists":
        return { success: true, value: mockStorage.has(args[0]) };
      
      default:
        return { success: false, error: "Unknown method" };
    }
  };
  
  it("should create an identity", () => {
    const result = mockContractCall("create-identity", ["Alice", 631152000, "USA"], "user1");
    expect(result.success).toBe(true);
  });
  
  it("should not create duplicate identity", () => {
    mockContractCall("create-identity", ["Alice", 631152000, "USA"], "user1");
    const result = mockContractCall("create-identity", ["Alice", 631152000, "USA"], "user1");
    expect(result.success).toBe(false);
    expect(result.error).toBe("ERR_ALREADY_EXISTS");
  });
  
  it("should update an identity", () => {
    mockContractCall("create-identity", ["Alice", 631152000, "USA"], "user1");
    const result = mockContractCall("update-identity", ["Alice Smith", 631152000, "Canada"], "user1");
    expect(result.success).toBe(true);
  });
  
  it("should not update non-existent identity", () => {
    const result = mockContractCall("update-identity", ["Alice Smith", 631152000, "Canada"], "user1");
    expect(result.success).toBe(false);
    expect(result.error).toBe("ERR_NOT_FOUND");
  });
  
  it("should delete an identity", () => {
    mockContractCall("create-identity", ["Alice", 631152000, "USA"], "user1");
    const result = mockContractCall("delete-identity", [], "user1");
    expect(result.success).toBe(true);
  });
  
  it("should not delete non-existent identity", () => {
    const result = mockContractCall("delete-identity", [], "user1");
    expect(result.success).toBe(false);
    expect(result.error).toBe("ERR_NOT_FOUND");
  });
  
  it("should get an identity", () => {
    mockContractCall("create-identity", ["Alice", 631152000, "USA"], "user1");
    const result = mockContractCall("get-identity", ["user1"], "anyone");
    expect(result.success).toBe(true);
    expect(result.value).toEqual({
      name: "Alice",
      "date-of-birth": 631152000,
      country: "USA",
      "created-at": 100,
      "updated-at": 100,
    });
  });
  
  it("should check if identity exists", () => {
    mockContractCall("create-identity", ["Alice", 631152000, "USA"], "user1");
    const result = mockContractCall("identity-exists", ["user1"], "anyone");
    expect(result.success).toBe(true);
    expect(result.value).toBe(true);
  });
});
