const axios = require("axios");
const cheerio = require("cheerio");
const FormData = require("form-data");

async function dragonBall(text) {
    try {
        const url = "https://en.ephoto360.com/create-dragon-ball-style-text-effects-online-809.html";

        const getPage = await axios.get(url, {
            headers: {
                "user-agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"
            }
        });

        const $ = cheerio.load(getPage.data);

        const token = $('input[name="token"]').val();
        const build_server = $('input[name="build_server"]').val();
        const build_server_id = $('input[name="build_server_id"]').val();

        if (!token || !build_server || !build_server_id) {
            return {
                success: false,
                message: "Token or build server not found"
            };
        }

        const form = new FormData();

        form.append("text[]", text);
        form.append("token", token);
        form.append("build_server", build_server);
        form.append("build_server_id", build_server_id);

        const postPage = await axios.post(url, form, {
            headers: {
                ...form.getHeaders(),
                "user-agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
                cookie: getPage.headers["set-cookie"]?.join("; ") || ""
            }
        });

        const $$ = cheerio.load(postPage.data);

        const raw = $$('input[name="form_value_input"]').val();

        if (!raw) {
            return {
                success: false,
                message: "form_value_input not found"
            };
        }

        const json = JSON.parse(raw);

        json["text[]"] = json.text;
        delete json.text;

        const { data } = await axios.post(
            "https://en.ephoto360.com/effect/create-image",
            new URLSearchParams(json),
            {
                headers: {
                    "user-agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
                    cookie: getPage.headers["set-cookie"]?.join("; ") || ""
                }
            }
        );

        return {
            success: true,
            message: "Working",
            image: build_server + data.image
        };

    } catch (err) {
        return {
            success: false,
            message: err.message || "Unknown Error"
        };
    }
}

(async () => {
    const result = await dragonBall("DanuZz");
    console.log(JSON.stringify(result, null, 2));
})();
