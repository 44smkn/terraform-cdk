import "cdktf/lib/testing/adapters/jest"; // Load types for expect matchers
import { Testing } from "cdktf";
import { EKSClusterStack } from "../main";
import { EKS } from "../.gen/providers/aws";

// https://www.terraform.io/docs/cdktf/test/unit-tests.html

describe("Unit testing using assertions", () => {
  it("should contain a cluster", () => {
    expect(
      Testing.synthScope((scope) => {
        new EKSClusterStack(scope, "my-app", { clusterName: "my-app" });
      })
    ).toHaveResourceWithProperties(EKS.EksCluster, { version: "1.21" });
  });
});
