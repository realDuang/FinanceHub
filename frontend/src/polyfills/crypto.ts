import SparkMD5 from "spark-md5";

class MD5Hash {
  private spark = new SparkMD5();

  update(data: string | ArrayBuffer | Uint8Array): MD5Hash {
    if (typeof data === "string") {
      this.spark.append(data);
      return this;
    }

    if (data instanceof Uint8Array) {
      this.spark.appendBinary(MD5Hash.uint8ToBinaryString(data));
      return this;
    }

    if (data instanceof ArrayBuffer) {
      this.spark.appendBinary(MD5Hash.uint8ToBinaryString(new Uint8Array(data)));
      return this;
    }

    throw new TypeError("Unsupported data type for MD5 update");
  }

  digest(encoding?: "hex"): string {
    const result = this.spark.end(false);
    if (encoding === "hex" || encoding === undefined) {
      return result;
    }
    throw new Error(`Unsupported digest encoding: ${encoding}`);
  }

  private static uint8ToBinaryString(data: Uint8Array): string {
    let binary = "";
    data.forEach((value) => {
      binary += String.fromCharCode(value);
    });
    return binary;
  }
}

const cryptoPolyfill = {
  createHash(algorithm: string) {
    if (algorithm.toLowerCase() !== "md5") {
      throw new Error(`Unsupported hash algorithm: ${algorithm}`);
    }
    return new MD5Hash();
  },
};

export default cryptoPolyfill;
