const fetch = require('node-fetch');

async function test() {
  console.log("Presigning...");
  const res = await fetch("https://server-taupe-six.vercel.app/api/media/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: "test.mp4", fileType: "video/mp4" })
  });
  const data = await res.json();
  console.log("Presign:", data);
  if (!data.success) return;

  console.log("Uploading dummy to signed URL...");
  const dummyFile = Buffer.alloc(1024 * 1024); // 1MB
  const upRes = await fetch(data.signedUrl, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4" },
    body: dummyFile
  });
  console.log("Upload status:", upRes.status);
  
  console.log("Submitting video to DB...");
  const submitRes = await fetch("https://server-taupe-six.vercel.app/api/voz/videos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      videoUrl: data.publicUrl,
      user: "@test",
      description: "Test",
      thumbnailUrl: "http://example.com/thumb.jpg"
    })
  });
  const submitData = await submitRes.json();
  console.log("Submit:", submitData);
}
test();
