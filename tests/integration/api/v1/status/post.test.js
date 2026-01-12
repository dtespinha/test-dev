describe("POST /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieving application status for an invalid method", async () => {
      const response = await fetch("http://localhost:3000/api/v1/status", {
        method: "POST",
      });
      expect(response.status).toBe(405);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "MethodNotAllowedError",
        message: "Method not allowed for this endpoint.",
        action: "Verify if the requested method is valid for this endpoint.",
        status_code: 405,
      });
    });
  });
});
