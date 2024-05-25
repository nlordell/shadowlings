// This file is MIT Licensed.
//
// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
pragma solidity ^0.8.0;
library Pairing {
    struct G1Point {
        uint X;
        uint Y;
    }
    // Encoding of field elements is: X[0] * z + X[1]
    struct G2Point {
        uint[2] X;
        uint[2] Y;
    }
    /// @return the generator of G1
    function P1() pure internal returns (G1Point memory) {
        return G1Point(1, 2);
    }
    /// @return the generator of G2
    function P2() pure internal returns (G2Point memory) {
        return G2Point(
            [10857046999023057135944570762232829481370756359578518086990519993285655852781,
             11559732032986387107991004021392285783925812861821192530917403151452391805634],
            [8495653923123431417604973247489272438418190587263600148770280649306958101930,
             4082367875863433681332203403145435568316851327593401208105741076214120093531]
        );
    }
    /// @return the negation of p, i.e. p.addition(p.negate()) should be zero.
    function negate(G1Point memory p) pure internal returns (G1Point memory) {
        // The prime q in the base field F_q for G1
        uint q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;
        if (p.X == 0 && p.Y == 0)
            return G1Point(0, 0);
        return G1Point(p.X, q - (p.Y % q));
    }
    /// @return r the sum of two points of G1
    function addition(G1Point memory p1, G1Point memory p2) internal view returns (G1Point memory r) {
        uint[4] memory input;
        input[0] = p1.X;
        input[1] = p1.Y;
        input[2] = p2.X;
        input[3] = p2.Y;
        bool success;
        assembly {
            success := staticcall(sub(gas(), 2000), 6, input, 0xc0, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require(success);
    }


    /// @return r the product of a point on G1 and a scalar, i.e.
    /// p == p.scalar_mul(1) and p.addition(p) == p.scalar_mul(2) for all points p.
    function scalar_mul(G1Point memory p, uint s) internal view returns (G1Point memory r) {
        uint[3] memory input;
        input[0] = p.X;
        input[1] = p.Y;
        input[2] = s;
        bool success;
        assembly {
            success := staticcall(sub(gas(), 2000), 7, input, 0x80, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require (success);
    }
    /// @return the result of computing the pairing check
    /// e(p1[0], p2[0]) *  .... * e(p1[n], p2[n]) == 1
    /// For example pairing([P1(), P1().negate()], [P2(), P2()]) should
    /// return true.
    function pairing(G1Point[] memory p1, G2Point[] memory p2) internal view returns (bool) {
        require(p1.length == p2.length);
        uint elements = p1.length;
        uint inputSize = elements * 6;
        uint[] memory input = new uint[](inputSize);
        for (uint i = 0; i < elements; i++)
        {
            input[i * 6 + 0] = p1[i].X;
            input[i * 6 + 1] = p1[i].Y;
            input[i * 6 + 2] = p2[i].X[1];
            input[i * 6 + 3] = p2[i].X[0];
            input[i * 6 + 4] = p2[i].Y[1];
            input[i * 6 + 5] = p2[i].Y[0];
        }
        uint[1] memory out;
        bool success;
        assembly {
            success := staticcall(sub(gas(), 2000), 8, add(input, 0x20), mul(inputSize, 0x20), out, 0x20)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require(success);
        return out[0] != 0;
    }
    /// Convenience method for a pairing check for two pairs.
    function pairingProd2(G1Point memory a1, G2Point memory a2, G1Point memory b1, G2Point memory b2) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](2);
        G2Point[] memory p2 = new G2Point[](2);
        p1[0] = a1;
        p1[1] = b1;
        p2[0] = a2;
        p2[1] = b2;
        return pairing(p1, p2);
    }
    /// Convenience method for a pairing check for three pairs.
    function pairingProd3(
            G1Point memory a1, G2Point memory a2,
            G1Point memory b1, G2Point memory b2,
            G1Point memory c1, G2Point memory c2
    ) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](3);
        G2Point[] memory p2 = new G2Point[](3);
        p1[0] = a1;
        p1[1] = b1;
        p1[2] = c1;
        p2[0] = a2;
        p2[1] = b2;
        p2[2] = c2;
        return pairing(p1, p2);
    }
    /// Convenience method for a pairing check for four pairs.
    function pairingProd4(
            G1Point memory a1, G2Point memory a2,
            G1Point memory b1, G2Point memory b2,
            G1Point memory c1, G2Point memory c2,
            G1Point memory d1, G2Point memory d2
    ) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](4);
        G2Point[] memory p2 = new G2Point[](4);
        p1[0] = a1;
        p1[1] = b1;
        p1[2] = c1;
        p1[3] = d1;
        p2[0] = a2;
        p2[1] = b2;
        p2[2] = c2;
        p2[3] = d2;
        return pairing(p1, p2);
    }
}

contract Verifier {
    using Pairing for *;
    struct VerifyingKey {
        Pairing.G1Point alpha;
        Pairing.G2Point beta;
        Pairing.G2Point gamma;
        Pairing.G2Point delta;
        Pairing.G1Point[] gamma_abc;
    }
    struct Proof {
        Pairing.G1Point a;
        Pairing.G2Point b;
        Pairing.G1Point c;
    }
    function verifyingKey() pure internal returns (VerifyingKey memory vk) {
        vk.alpha = Pairing.G1Point(uint256(0x2bfaa41b463a51ba4abb13e4eec89303171fc5524a5a43369f20c4d8b8c00253), uint256(0x28cd1c6f72279fbf563667f09f4d36d8e1cba9a630ea53ff911557774826e0a2));
        vk.beta = Pairing.G2Point([uint256(0x1180cdc4d9a482fb82630f48c75e82bca90f58871eaddada2fb1a5065d644049), uint256(0x303859019fe78915a599042b37e06788428153f5ecaa619cd2a884555043d3ad)], [uint256(0x19582c92e6b407d443e2afabddd57283d3c1ea362a9566fc353b72bd63b9ab31), uint256(0x0b5860af8e653f9cb5fd15aebe21672a57951237915b7ad0e04be27031bd1d84)]);
        vk.gamma = Pairing.G2Point([uint256(0x0a638c3eaf8a943465883e7a765810ef82e5f610e9979d9c43a8dd8be8228c3b), uint256(0x034200715eed6378771605c837b26d66ed9e869b016af7278360b9025113bb0c)], [uint256(0x1b121e52f93f518f2d6951bace4d9154275f66ac9d588f5b04ff0006afea92f2), uint256(0x15fa13f75d8ae0f2f9845d3a5eb602ad949055a1241b4e7038901385987991fc)]);
        vk.delta = Pairing.G2Point([uint256(0x16fb0246d570da26048151f44cd55fddcff18ce61b57da21b4820b5b63393dcd), uint256(0x2f3a581afb712b719b14b6fd7a9447f7c59426e6b06146382a6d3ffec609de24)], [uint256(0x1eea6a7a2fee41593e9efd851a16d8a6d376b2830f196ee4763a88fba5f1f49e), uint256(0x02132a26c36d99dc789cf703218161478c7820caf47f5899d23da2bf8e94c3d0)]);
        vk.gamma_abc = new Pairing.G1Point[](7);
        vk.gamma_abc[0] = Pairing.G1Point(uint256(0x172033b9026d401c40f1fa193b6c49932ece6d86931a1ce94d9a043da0cdc66e), uint256(0x1ed8b15a0154a32cc0c62ea9bb4a7b7ce646a47bd15be59d6d552048b36f32e9));
        vk.gamma_abc[1] = Pairing.G1Point(uint256(0x2de7b8600609f83e01553ce4155ad56f5e25c739f0f6bb05f68c9e617f56ea90), uint256(0x2015032b96e272066d86aef7272bc7a129b70a624277a5a4ae184500dfaa87df));
        vk.gamma_abc[2] = Pairing.G1Point(uint256(0x25afc42552d49d02398dd38f0fced48ddb35bce3aebd7197789dcfa7526ac557), uint256(0x15eebfb2b11094a0966660747e994cb591600758ea4b7172c5fb725616d2907f));
        vk.gamma_abc[3] = Pairing.G1Point(uint256(0x0b8045912ef8e7137947478e2a539ebe535bb9a604054399023c1c743337332a), uint256(0x16866f937e4cbbc6caf19f66f771f93e3b3ff4be6eb99c5d00b5667ba36bbff6));
        vk.gamma_abc[4] = Pairing.G1Point(uint256(0x0abee4de77a7ce7289e433cb00f352e98970f7c10f64fa9276b9eec8eb68527b), uint256(0x267dda4800cece72d878bf9d076d3f2c0c90ffd0f0ca5a6b77c59381023d917c));
        vk.gamma_abc[5] = Pairing.G1Point(uint256(0x19f210130dd743c1d0203dbe52e9ea94600b0f17dabac1a2c2e2e40024268177), uint256(0x2b9ff7cf57391065cf6cbe1c0c1af043489d69edeb01a06a06dbc587d319ade2));
        vk.gamma_abc[6] = Pairing.G1Point(uint256(0x1451b9fe7e985466cd013f38b8110bd38fc4b18b903e9ab6a7718430018324d5), uint256(0x25034cbfe6c4fc1221305323d74506af83792f2762d0d07aeba4430c21014337));
    }
    function verify(uint[] memory input, Proof memory proof) internal view returns (uint) {
        uint256 snark_scalar_field = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        VerifyingKey memory vk = verifyingKey();
        require(input.length + 1 == vk.gamma_abc.length);
        // Compute the linear combination vk_x
        Pairing.G1Point memory vk_x = Pairing.G1Point(0, 0);
        for (uint i = 0; i < input.length; i++) {
            require(input[i] < snark_scalar_field);
            vk_x = Pairing.addition(vk_x, Pairing.scalar_mul(vk.gamma_abc[i + 1], input[i]));
        }
        vk_x = Pairing.addition(vk_x, vk.gamma_abc[0]);
        if(!Pairing.pairingProd4(
             proof.a, proof.b,
             Pairing.negate(vk_x), vk.gamma,
             Pairing.negate(proof.c), vk.delta,
             Pairing.negate(vk.alpha), vk.beta)) return 1;
        return 0;
    }
    function verifyTx(
            Proof memory proof, uint[6] memory input
        ) public view returns (bool r) {
        uint[] memory inputValues = new uint[](6);
        
        for(uint i = 0; i < input.length; i++){
            inputValues[i] = input[i];
        }
        if (verify(inputValues, proof) == 0) {
            return true;
        } else {
            return false;
        }
    }
}
