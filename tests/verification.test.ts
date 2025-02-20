import { describe, it, beforeEach, expect } from "vitest"

describe("Verification Contract", () => {
  let mockStorage: Map<string, any>
  let verificationNonce: number
  const CONTRACT_OWNER = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
  
  beforeEach(() => {
    mockStorage = new Map()
    verificationNonce = 0
  })
  
  const mockContractCall = (method: string, args: any[], sender: string) => {
    switch (method) {
      case "authorize-verifier":
        if (sender !== CONTRACT_OWNER) {
          return { success: false, error: "ERR_NOT_AUTHORIZED" }
        }
        mockStorage.set(`verifier-${args[0]}`, { authorized: true })
        return { success: true }
      
      case "revoke-verifier-authorization":
        if (sender !== CONTRACT_OWNER) {
          return { success: false, error: "ERR_NOT_AUTHORIZED" }
        }
        mockStorage.set(`verifier-${args[0]}`, { authorized: false })
        return { success: true }
      
      case "verify-credential":
        const [credentialId, status] = args
        if (!mockStorage.get(`verifier-${sender}`)?.authorized) {
          return { success: false, error: "ERR_NOT_AUTHORIZED" }
        }
        verificationNonce++
        mockStorage.set(`verification-${verificationNonce}`, {
          verifier: sender,
          "credential-id": credentialId,
          status,
          "verified-at": 100, // mock block height
        })
        return { success: true, value: verificationNonce }
      
      case "get-verification":
        return { success: true, value: mockStorage.get(`verification-${args[0]}`) }
      
      case "is-authorized-verifier":
        return { success: true, value: mockStorage.get(`verifier-${args[0]}`)?.authorized || false }
      
      case "get-latest-verification":
        const verifications = Array.from(mockStorage.entries())
            .filter(([key, value]) => key.startsWith("verification-") && value["credential-id"] === args[0])
            .map(([key, value]) => ({ ...value, "verification-id": Number.parseInt(key.split("-")[1]) }))
        return {
          success: true,
          value: verifications.reduce(
              (latest, current) => (current["verified-at"] > latest["verified-at"] ? current : latest),
              { "verification-id": 0, verifier: "", "credential-id": 0, status: "", "verified-at": 0 },
          ),
        }
      
      default:
        return { success: false, error: "Unknown method" }
    }
  }
  
  it("should authorize a verifier", () => {
    const result = mockContractCall("authorize-verifier", ["verifier1"], CONTRACT_OWNER)
    expect(result.success).toBe(true)
  })
  
  it("should not authorize a verifier if not contract owner", () => {
    const result = mockContractCall("authorize-verifier", ["verifier1"], "user1")
    expect(result.success).toBe(false)
    expect(result.error).toBe("ERR_NOT_AUTHORIZED")
  })
  
  it("should revoke verifier authorization", () => {
    mockContractCall("authorize-verifier", ["verifier1"], CONTRACT_OWNER)
    const result = mockContractCall("revoke-verifier-authorization", ["verifier1"], CONTRACT_OWNER)
    expect(result.success).toBe(true)
  })
  
  it("should verify a credential", () => {
    mockContractCall("authorize-verifier", ["verifier1"], CONTRACT_OWNER)
    const result = mockContractCall("verify-credential", [1, "valid"], "verifier1")
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
  })
  
  it("should not verify a credential if not authorized", () => {
    const result = mockContractCall("verify-credential", [1, "valid"], "verifier1")
    expect(result.success).toBe(false)
    expect(result.error).toBe("ERR_NOT_AUTHORIZED")
  })
  
  it("should get a verification", () => {
    mockContractCall("authorize-verifier", ["verifier1"], CONTRACT_OWNER)
    mockContractCall("verify-credential", [1, "valid"], "verifier1")
    const result = mockContractCall("get-verification", [1], "anyone")
    expect(result.success).toBe(true)
    expect(result.value).toEqual({
      verifier: "verifier1",
      "credential-id": 1,
      status: "valid",
      "verified-at": 100,
    })
  })
  
  it("should check if a verifier is authorized", () => {
    mockContractCall("authorize-verifier", ["verifier1"], CONTRACT_OWNER)
    const result = mockContractCall("is-authorized-verifier", ["verifier1"], "anyone")
    expect(result.success).toBe(true)
    expect(result.value).toBe(true)
  })
})

